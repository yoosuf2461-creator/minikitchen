import { GoogleGenAI } from '@google/genai';
import fs from 'fs/promises';
import path from 'path';
import { getMenuItems, getRestaurantInfo, addReservation } from './db';
import { MenuItem, Reservation, RestaurantInfo } from './types';

export interface ChatMessageInput {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponseOutput {
  reply: string;
  reservationCreated?: Reservation;
  modelUsed: string;
}

function formatMenuContext(menu: MenuItem[]): string {
  return menu
    .map((item) => {
      const avail = item.available ? 'AVAILABLE' : 'CURRENTLY SOLD OUT';
      const diets = item.dietary.length > 0 ? ` [Dietary: ${item.dietary.join(', ')}]` : '';
      return `- ${item.name} (LKR ${item.price.toLocaleString()}) [Category: ${item.category}] [Status: ${avail}]${diets}: ${item.description}`;
    })
    .join('\n');
}

function formatHoursContext(info: RestaurantInfo): string {
  return info.hours
    .map((h) => `${h.day}: ${h.isClosed ? 'Closed (Kitchen Rest)' : `${h.open} - ${h.close}`}`)
    .join(', ');
}

export function getCurrentTemporalContext(info: RestaurantInfo) {
  const now = new Date();
  const timeZone = 'Asia/Colombo'; // MiniKitchen Colombo location timezone (UTC+5:30)

  const dayFormatter = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long' });
  const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone }); // YYYY-MM-DD
  const prettyDateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const currentDay = dayFormatter.format(now); // e.g. "Monday"
  const currentDate = dateFormatter.format(now); // e.g. "2026-10-26"
  const currentPrettyDate = prettyDateFormatter.format(now); // e.g. "October 26, 2026"
  const currentTime = timeFormatter.format(now); // e.g. "09:30"

  const todayHours = info.hours.find((h) => h.day.toLowerCase() === currentDay.toLowerCase());
  const isTodayClosed = Boolean(
    todayHours &&
      (todayHours.isClosed ||
        todayHours.open.toLowerCase().includes('closed') ||
        todayHours.close.toLowerCase().includes('rest'))
  );

  const todayStatus = isTodayClosed
    ? `CLOSED today (${currentDay}) for Kitchen Rest.`
    : `OPEN today (${currentDay}): ${todayHours?.open} – ${todayHours?.close}`;

  // Next open day calculation
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  let nextOpenDay = '';
  let nextOpenHours = '';
  if (isTodayClosed) {
    const todayIdx = dayNames.indexOf(currentDay);
    for (let i = 1; i <= 7; i++) {
      const checkDay = dayNames[(todayIdx + i) % 7];
      const h = info.hours.find((x) => x.day.toLowerCase() === checkDay.toLowerCase());
      if (h && !h.isClosed && !h.open.toLowerCase().includes('closed')) {
        nextOpenDay = checkDay;
        nextOpenHours = `${h.open} – ${h.close}`;
        break;
      }
    }
  }

  return {
    currentDay,
    currentDate,
    currentPrettyDate,
    currentTime,
    todayHours,
    isTodayClosed,
    todayStatus,
    nextOpenDay,
    nextOpenHours,
  };
}

export async function processChat(
  messages: ChatMessageInput[],
  clientApiKey?: string
): Promise<ChatResponseOutput> {
  const menu = await getMenuItems();
  const info = await getRestaurantInfo();

  // Support n8n Webhook if configured
  const n8nWebhook = process.env.N8N_WEBHOOK_URL;
  if (n8nWebhook && n8nWebhook.startsWith('http')) {
    try {
      const n8nRes = await fetch(n8nWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, menu, info }),
      });
      if (n8nRes.ok) {
        const n8nData = await n8nRes.json();
        if (n8nData && n8nData.reply) {
          return {
            reply: n8nData.reply,
            reservationCreated: n8nData.reservationCreated,
            modelUsed: 'n8n Workflow Automation',
          };
        }
      }
    } catch (err) {
      console.warn('n8n webhook error, falling back to Gemini / smart engine:', err);
    }
  }

  // Support Gemini API (Free tier / user key / env key)
  let apiKey = clientApiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey || apiKey.trim().length < 10) {
    try {
      const envPath = path.join(process.cwd(), '.env.local');
      const envRaw = await fs.readFile(envPath, 'utf-8');
      const match = envRaw.match(/GEMINI_API_KEY\s*=\s*([^\r\n#]+)/);
      if (match && match[1] && match[1].trim().length > 10) {
        apiKey = match[1].trim();
      }
    } catch {
      // file might not exist or readable
    }
  }

  if (apiKey && apiKey.trim().length > 10) {
    try {
      const result = await callGeminiAPI(messages, menu, info, apiKey.trim());
      if (result) {
        return result;
      }
    } catch (err) {
      console.warn('Gemini API call error, falling back to smart concierge engine:', err);
    }
  }

  // Fallback intelligent concierge engine
  return fallbackConciergeEngine(messages, menu, info);
}

async function callGeminiAPI(
  messages: ChatMessageInput[],
  menu: MenuItem[],
  info: RestaurantInfo,
  apiKey: string
): Promise<ChatResponseOutput | null> {
  const ai = new GoogleGenAI({ apiKey });

  const temporal = getCurrentTemporalContext(info);

  const systemInstruction = `You are Remy, the gracious, culinary-savvy AI Concierge for MiniKitchen restaurant.
Location: ${info.address}, ${info.city}. Phone: ${info.phone}. Email: ${info.email}.

LIVE CLOCK & REAL-TIME TEMPORAL CONTEXT (STRICT GROUND TRUTH):
• Today's Exact Day of Week: ${temporal.currentDay}
• Today's Exact Date: ${temporal.currentDate} (${temporal.currentPrettyDate})
• Current Local Time: ${temporal.currentTime} (Asia/Colombo Sri Lanka Time, UTC+5:30)
• Today's Operational Status: ${temporal.todayStatus}
${temporal.isTodayClosed ? `• Next Open Service: Reopening on ${temporal.nextOpenDay} (${temporal.nextOpenHours})` : ''}

WEEKLY OPERATING HOURS SCHEDULE:
${formatHoursContext(info)}.

LIVE RESTAURANT MENU (Live from kitchen database):
${formatMenuContext(menu)}

TEMPORAL ACCURACY & OPERATING HOURS RULES:
1. STRICT GROUND TRUTH: You MUST use the live clock above. Today is ${temporal.currentDay}, ${temporal.currentPrettyDate}. NEVER claim today is Wednesday or any other day.
2. TODAY'S HOURS / OPEN STATUS:
${
  temporal.isTodayClosed
    ? `   - Today is ${temporal.currentDay}, and the restaurant is CLOSED for our weekly culinary rest (Kitchen Rest).
   - If a guest asks "are you open today?" or "what are your hours today?", politely inform them that today (${temporal.currentDay}) our kitchen is resting, and that we look forward to welcoming them when we reopen tomorrow (${temporal.nextOpenDay}) from ${temporal.nextOpenHours}!
   - If a guest asks to reserve for "today" or "tonight" on ${temporal.currentDay}, warmly inform them that we are closed tonight for our weekly rest, but you would be delighted to arrange a table for tomorrow (${temporal.nextOpenDay}) or any upcoming day.`
    : `   - Today is ${temporal.currentDay}, and we are OPEN today from ${temporal.todayHours?.open} to ${temporal.todayHours?.close}.`
}
3. CALENDAR REFERENCES:
   - When a guest says "today" or "tonight", the date is ${temporal.currentDate} (${temporal.currentDay}).
   - When a guest says "tomorrow", the date is the day after ${temporal.currentDate} (${temporal.nextOpenDay || 'tomorrow'}).
   - When a guest mentions a specific day (e.g. "Tuesday", "Friday"), match it to the upcoming occurrence.

YOUR ROLES & STRICT GUIDELINES:
1. Answer guest inquiries about MiniKitchen, cuisine, atmosphere, hours, and menu with elegance and accuracy.
2. If an item is marked "CURRENTLY SOLD OUT", inform the guest politely if they ask about it.
3. TABLE RESERVATIONS:
   To book a table, you MUST collect ALL of the following details from the customer:
   - Guest Full Name
   - Contact info (Phone number or Email address)
   - Date (YYYY-MM-DD or clearly identified calendar date)
   - Time (e.g. 19:00 or 7:00 PM)
   - Guest Count (number of people)
   - Special Requests / Dietary needs (optional)
   
   If ANY of these details are missing, warmly ask the guest for the missing items.
   
   Once you have all details, call the "create_pending_reservation" tool to save the booking.
   
   CRITICAL REQUIREMENT:
   The chatbot MUST NOT call the reservation "Confirmed".
   When a booking is placed, explicitly remind the guest that their reservation is saved as "PENDING" and awaiting approval by the restaurant manager/host team.`;

  const contents = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const tools = [
    {
      functionDeclarations: [
        {
          name: 'create_pending_reservation',
          description:
            'Save a new table reservation with PENDING status in the restaurant admin dashboard once all customer details (name, contact, date, time, guest count) are collected.',
          parameters: {
            type: 'OBJECT',
            properties: {
              guestName: { type: 'STRING', description: 'Full name of the guest' },
              contact: { type: 'STRING', description: 'Phone number or email address' },
              date: { type: 'STRING', description: 'Date in YYYY-MM-DD or readable date format' },
              time: { type: 'STRING', description: 'Preferred reservation time e.g. 19:30 or 7:30 PM' },
              guestCount: { type: 'INTEGER', description: 'Total number of guests' },
              specialRequests: { type: 'STRING', description: 'Any dietary needs, allergies, or table preferences' },
            },
            required: ['guestName', 'contact', 'date', 'time', 'guestCount'],
          },
        },
      ],
    },
  ];

  // Production models: gemini-3.1-flash-lite is lightning fast (~1.1s) and has high Free Tier quota
  const candidateModels = [
    process.env.GEMINI_MODEL,
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.7-flash',
  ].filter(Boolean) as string[];

  // Deduplicate
  const modelQueue = Array.from(new Set(candidateModels));

  let response: any = null;
  let modelUsed = modelQueue[0];

  for (const model of modelQueue) {
    try {
      response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: 0.3,
          tools: tools as any,
        },
      });
      if (response?.candidates?.[0]) {
        modelUsed = model;
        break;
      }
    } catch (err: any) {
      console.warn(`Gemini (${model}) failed, trying next candidate:`, err?.status || err?.message || err);
    }
  }

  if (!response?.candidates?.[0]) {
    console.error('All Gemini model calls failed or exceeded rate limits, falling back.');
    return null;
  }

  const candidate = response?.candidates?.[0];
  const functionCalls = candidate?.content?.parts?.filter((p: any) => p.functionCall);

  if (functionCalls && functionCalls.length > 0) {
    const call = functionCalls[0].functionCall;
    if (call && call.name === 'create_pending_reservation') {
      const args: any = call.args || {};
      const contactStr = String(args.contact || '');
      const isEmail = contactStr.includes('@');

      const newReservation = await addReservation({
        guestName: String(args.guestName || 'Guest'),
        phone: isEmail ? '' : contactStr,
        email: isEmail ? contactStr : '',
        date: String(args.date || temporal.currentDate),
        time: String(args.time || '19:00'),
        guestCount: Number(args.guestCount) || 2,
        specialRequests: args.specialRequests ? String(args.specialRequests) : undefined,
        status: 'Pending', // ALWAYS Pending per spec
        source: 'ai_chatbot',
      });

      const reply = `I have received your table booking request for **${newReservation.guestName}**!

📋 **Reservation Summary**:
- **Party Size**: ${newReservation.guestCount} guests
- **Date & Time**: ${newReservation.date} at ${newReservation.time}
- **Contact**: ${contactStr}
${newReservation.specialRequests ? `- **Special Requests**: ${newReservation.specialRequests}` : ''}
- **Booking Reference**: \`${newReservation.id}\`
- **Current Status**: ⏳ **PENDING**

⚠️ *Please note: Your reservation is currently **PENDING** review by our host team and is not yet confirmed. An admin will review our seating arrangements and notify you shortly!*`;

      return {
        reply,
        reservationCreated: newReservation,
        modelUsed: `Google Gemini (${modelUsed})`,
      };
    }
  }

  const textPart = candidate?.content?.parts?.find((p: any) => p.text);
  if (textPart?.text) {
    return {
      reply: textPart.text,
      modelUsed: `Google Gemini (${modelUsed})`,
    };
  }

  return null;
}

// Fallback concierge engine that intelligently understands menu queries and extracts table bookings
async function fallbackConciergeEngine(
  messages: ChatMessageInput[],
  menu: MenuItem[],
  info: RestaurantInfo
): Promise<ChatResponseOutput> {
  const temporal = getCurrentTemporalContext(info);
  const latestUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content.toLowerCase() || '';
  const fullConversation = messages.map((m) => `${m.role}: ${m.content}`).join('\n');

  // Check if user is asking for menu questions
  if (latestUserMsg.includes('menu') || latestUserMsg.includes('food') || latestUserMsg.includes('dish') || latestUserMsg.includes('serve')) {
    if (latestUserMsg.includes('vegetarian') || latestUserMsg.includes('veggie')) {
      const veg = menu.filter((m) => m.dietary.includes('Vegetarian') || m.dietary.includes('Vegan'));
      const list = veg.map((v) => `• **${v.name}** (LKR ${v.price.toLocaleString()}) - ${v.description} (${v.available ? 'In stock' : 'Sold out'})`).join('\n');
      return {
        reply: `Here are our handcrafted vegetarian and vegan specialties at MiniKitchen:\n\n${list}\n\nWould you like recommendations on wine pairings or dessert?`,
        modelUsed: 'MiniKitchen Concierge AI',
      };
    }

    if (latestUserMsg.includes('vegan')) {
      const vegan = menu.filter((m) => m.dietary.includes('Vegan'));
      const list = vegan.map((v) => `• **${v.name}** (LKR ${v.price.toLocaleString()}) - ${v.description} (${v.available ? 'In stock' : 'Sold out'})`).join('\n');
      return {
        reply: `Our current plant-based 100% vegan creations:\n\n${list}\n\nAll made with fresh organic seasonal produce!`,
        modelUsed: 'MiniKitchen Concierge AI',
      };
    }

    if (latestUserMsg.includes('gluten') || latestUserMsg.includes('gf')) {
      const gf = menu.filter((m) => m.dietary.includes('Gluten-Free'));
      const list = gf.map((v) => `• **${v.name}** (LKR ${v.price.toLocaleString()}) - ${v.description} (${v.available ? 'In stock' : 'Sold out'})`).join('\n');
      return {
        reply: `Our gluten-free options prepared in our dedicated prep area:\n\n${list}`,
        modelUsed: 'MiniKitchen Concierge AI',
      };
    }

    // General menu summary
    const highlights = menu.slice(0, 5).map((m) => `• **${m.name}** (LKR ${m.price.toLocaleString()}) [${m.category}] - ${m.description} (${m.available ? 'Available' : 'Sold Out'})`).join('\n');
    return {
      reply: `Welcome to MiniKitchen! Here are some of our popular seasonal highlights:\n\n${highlights}\n\nYou can view all items in our interactive menu above. Would you like to reserve a table to join us?`,
      modelUsed: 'MiniKitchen Concierge AI',
    };
  }

  // Inquiries about hours, location, contact
  if (
    latestUserMsg.includes('hour') ||
    latestUserMsg.includes('open') ||
    latestUserMsg.includes('closed') ||
    latestUserMsg.includes('time') ||
    latestUserMsg.includes('close') ||
    latestUserMsg.includes('today') ||
    latestUserMsg.includes('tonight')
  ) {
    const hours = info.hours
      .map((h) => `• **${h.day}**: ${h.isClosed ? 'Closed (Kitchen Rest)' : `${h.open} – ${h.close}`}`)
      .join('\n');

    if (
      latestUserMsg.includes('today') ||
      latestUserMsg.includes('tonight') ||
      latestUserMsg.includes('now') ||
      latestUserMsg.includes('open')
    ) {
      if (temporal.isTodayClosed) {
        return {
          reply: `Today is **${temporal.currentDay}, ${temporal.currentPrettyDate}**, and MiniKitchen is closed for our weekly culinary rest (Kitchen Rest).\n\nWe reopen tomorrow (**${temporal.nextOpenDay}**) from **${temporal.nextOpenHours}**.\n\nWould you like to reserve a table for tomorrow or another evening this week?`,
          modelUsed: 'MiniKitchen Concierge AI',
        };
      } else {
        return {
          reply: `Today is **${temporal.currentDay}, ${temporal.currentPrettyDate}**, and we are open! Today's service hours are **${temporal.todayHours?.open} – ${temporal.todayHours?.close}**.\n\nWould you like to reserve a table for this evening?`,
          modelUsed: 'MiniKitchen Concierge AI',
        };
      }
    }

    return {
      reply: `Today is **${temporal.currentDay}, ${temporal.currentPrettyDate}** (${temporal.todayStatus}).\n\nHere are MiniKitchen's weekly operating hours:\n\n${hours}\n\nWe are located at **${info.address}, ${info.city}**. Would you like to reserve a table?`,
      modelUsed: 'MiniKitchen Concierge AI',
    };
  }

  if (latestUserMsg.includes('address') || latestUserMsg.includes('location') || latestUserMsg.includes('where') || latestUserMsg.includes('phone')) {
    return {
      reply: `MiniKitchen is located at **${info.address}, ${info.city}** in the historic Culinary Quarter. You can reach our front desk at **${info.phone}** or via email at **${info.email}**. Valet parking is available every evening!`,
      modelUsed: 'MiniKitchen Concierge AI',
    };
  }

  // Reservation extraction logic
  const isBookingIntent =
    latestUserMsg.includes('book') ||
    latestUserMsg.includes('reserve') ||
    latestUserMsg.includes('table') ||
    latestUserMsg.includes('reservation') ||
    latestUserMsg.includes('party') ||
    latestUserMsg.includes('guests') ||
    fullConversation.toLowerCase().includes('reserve') ||
    fullConversation.toLowerCase().includes('book');

  if (isBookingIntent) {
    // Extract email
    const emailMatch = fullConversation.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const email = emailMatch ? emailMatch[1] : null;

    // Extract phone numbers (handles Sri Lankan 077 123 4567, 0771234567, +94..., and international)
    const phoneMatch =
      fullConversation.match(/(?:phone|mobile|tel|contact)?[:\s]*(\+?\d{1,3}[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4})/i) ||
      fullConversation.match(/((?:\+94|0)\s*(?:7\d{1}|11|2\d{1}|3\d{1}|4\d{1}|5\d{1}|6\d{1}|8\d{1})\s*\d{3}\s*\d{4})/) ||
      fullConversation.match(/(\b0\d{9}\b)/) ||
      fullConversation.match(/(\b\d{9,12}\b)/);
    const phone = phoneMatch ? phoneMatch[1].trim() : null;

    // Extract name (handles "Yoosuf", "I'm Yoosuf", "name: Yoosuf", "my name is Yoosuf", etc.)
    let name: string | null = null;
    const explicitNameMatch =
      fullConversation.match(/(?:my\s+name\s+is|name\s*[:=]\s*|under\s+(?:the\s+name\s+of)?|i\s*['’]?\s*m|i\s+am)\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)/i) ||
      fullConversation.match(/(?:name\s+is|under)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);

    if (explicitNameMatch) {
      name = explicitNameMatch[1].trim();
    } else {
      // Heuristic: check if user provided a plain name in any user turn
      for (const msg of [...messages].reverse()) {
        if (msg.role === 'user') {
          const stripped = msg.content
            .replace(/[0-9+()\-@.]/g, ' ')
            .replace(/\b(book|booking|table|tonight|tomorrow|people|guests|persons|pm|am|at|for|please|hi|hello|hey|want|need|reserve|reservation|yes|ok|okay)\b/gi, '')
            .trim();
          const words = stripped.split(/\s+/).filter((w) => w.length >= 2);
          if (words.length >= 1 && words.length <= 3) {
            name = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            break;
          }
        }
      }
    }

    // Extract guest count (e.g. "for 4", "party of 2", "3 people", "2 guests") - default to 2
    const guestMatch =
      fullConversation.match(/(?:for|party\s+of|table\s+for)\s+(\d+)/i) ||
      fullConversation.match(/(\d+)\s*(?:people|guests|persons|adults)/i);
    const guestCount = guestMatch ? parseInt(guestMatch[1], 10) : 2;

    // Extract time (e.g. "7:30 pm", "19:00", "8pm", "at 6:30") - default to 19:30
    const timeMatch =
      fullConversation.match(/(\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b)/i) ||
      fullConversation.match(/(\b[0-2]?\d:[0-5]\d\b)/i) ||
      fullConversation.match(/at\s+(\d{1,2}(?::\d{2})?)/i);
    const time = timeMatch ? timeMatch[1].toUpperCase() : '19:30';

    // Extract date (e.g. "tomorrow", "tonight", "october 26", "2026-10-25") - default to today in Colombo
    let date: string | null = null;
    if (fullConversation.toLowerCase().includes('tomorrow')) {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo' }).format(tomorrow);
    } else {
      const dateRegexMatch = fullConversation.match(/\b(202\d-\d{1,2}-\d{1,2})\b/);
      if (dateRegexMatch) {
        date = dateRegexMatch[1];
      } else {
        const namedDateMatch = fullConversation.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
        if (namedDateMatch) {
          date = `This ${namedDateMatch[1].charAt(0).toUpperCase() + namedDateMatch[1].slice(1).toLowerCase()}`;
        } else {
          date = temporal.currentDate;
        }
      }
    }

    const missingDetails: string[] = [];
    if (!name) missingDetails.push('your full name');
    if (!phone && !email) missingDetails.push('a contact phone number or email');

    if (missingDetails.length > 0) {
      const knownPieces: string[] = [];
      if (name) knownPieces.push(`Guest: ${name}`);
      if (phone || email) knownPieces.push(`Contact: ${phone || email}`);
      if (guestCount) knownPieces.push(`Party: ${guestCount} guests`);
      if (date) knownPieces.push(`Date: ${date}`);
      if (time) knownPieces.push(`Time: ${time}`);

      return {
        reply: `I would be delighted to arrange a table for you at MiniKitchen! ${
          knownPieces.length > 0 ? `I have noted (${knownPieces.join(', ')}). ` : ''
        }To complete your reservation request, could you please provide: **${missingDetails.join(' and ')}**?`,
        modelUsed: 'MiniKitchen Concierge AI',
      };
    }

    // All necessary details collected -> create Pending reservation
    const newReservation = await addReservation({
      guestName: name || 'Valued Guest',
      phone: phone || '',
      email: email || '',
      date: date || temporal.currentDate,
      time: time || '19:30',
      guestCount: guestCount || 2,
      specialRequests: 'Booked via MiniKitchen AI Concierge chat',
      status: 'Pending', // ALWAYS Pending per spec
      source: 'ai_chatbot',
    });

    const reply = `Wonderful, ${newReservation.guestName}! I have recorded your table booking request.

📋 **Reservation Summary**:
- **Guest Name**: ${newReservation.guestName}
- **Party Size**: ${newReservation.guestCount} guests
- **Date & Time**: ${newReservation.date} at ${newReservation.time}
- **Contact**: ${phone || email}
- **Booking Reference**: \`${newReservation.id}\`
- **Current Status**: ⏳ **PENDING**

⚠️ **Important Confirmation Notice**:
Your reservation is currently **PENDING** and visible inside our admin dashboard. It has **NOT** been confirmed yet. Our host team will review our dining room floor plan and contact you shortly to confirm your table!`;

    return {
      reply,
      reservationCreated: newReservation,
      modelUsed: 'MiniKitchen Concierge AI',
    };
  }

  // Default warm assistance
  return {
    reply: `Hello! I'm Remy, your AI Concierge at MiniKitchen. I can assist you with our artisanal menu, dietary accommodations (gluten-free, vegan, vegetarian), opening hours, or assist you with booking a table! How can I help you today?`,
    modelUsed: 'MiniKitchen Concierge AI',
  };
}
