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
    .map((h) => `${h.day}: ${h.isClosed ? 'Closed' : `${h.open} - ${h.close}`}`)
    .join(', ');
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

  const systemInstruction = `You are Remy, the gracious, culinary-savvy AI Concierge for MiniKitchen restaurant.
Location: ${info.address}, ${info.city}. Phone: ${info.phone}. Email: ${info.email}.
Operating Hours: ${formatHoursContext(info)}.

LIVE RESTAURANT MENU (Live from kitchen database):
${formatMenuContext(menu)}

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
        date: String(args.date || new Date().toISOString().split('T')[0]),
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
  if (latestUserMsg.includes('hour') || latestUserMsg.includes('open') || latestUserMsg.includes('time') || latestUserMsg.includes('close')) {
    const hours = info.hours.map((h) => `• **${h.day}**: ${h.isClosed ? 'Kitchen Rest' : `${h.open} – ${h.close}`}`).join('\n');
    return {
      reply: `Here are MiniKitchen's operating hours:\n\n${hours}\n\nWe are located at **${info.address}, ${info.city}**. Dinner service begins at 18:00 (Lunch Fri–Sun from 12:00). Would you like to book a table?`,
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
    // Extract guest count (e.g. "for 4", "party of 2", "3 people", "2 guests")
    const guestMatch =
      fullConversation.match(/(?:for|party\s+of|table\s+for)\s+(\d+)/i) ||
      fullConversation.match(/(\d+)\s*(?:people|guests|persons|adults)/i);
    const guestCount = guestMatch ? parseInt(guestMatch[1], 10) : null;

    // Extract time (e.g. "7:30 pm", "19:00", "8pm", "at 6:30")
    const timeMatch =
      fullConversation.match(/(\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b)/i) ||
      fullConversation.match(/(\b[0-2]?\d:[0-5]\d\b)/i) ||
      fullConversation.match(/at\s+(\d{1,2}(?::\d{2})?)/i);
    const time = timeMatch ? timeMatch[1].toUpperCase() : null;

    // Extract date (e.g. "tomorrow", "tonight", "october 26", "2026-10-25", "friday", "saturday")
    let date: string | null = null;
    const now = new Date();
    if (fullConversation.toLowerCase().includes('tonight') || fullConversation.toLowerCase().includes('today')) {
      date = now.toISOString().split('T')[0];
    } else if (fullConversation.toLowerCase().includes('tomorrow')) {
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      date = tomorrow.toISOString().split('T')[0];
    } else {
      const dateRegexMatch = fullConversation.match(/\b(202\d-\d{1,2}-\d{1,2})\b/);
      if (dateRegexMatch) {
        date = dateRegexMatch[1];
      } else {
        const namedDateMatch = fullConversation.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
        if (namedDateMatch) {
          date = `This ${namedDateMatch[1].charAt(0).toUpperCase() + namedDateMatch[1].slice(1).toLowerCase()}`;
        }
      }
    }

    // Extract email
    const emailMatch = fullConversation.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const email = emailMatch ? emailMatch[1] : null;

    // Extract phone (supports international +94..., local 077..., and US formats)
    const phoneMatch =
      fullConversation.match(/(?:phone|mobile|tel|contact)?[:\s]*(\+?\d{1,3}[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4})/i) ||
      fullConversation.match(/(\+?\d{9,14})/);
    const phone = phoneMatch ? phoneMatch[1].trim() : null;

    // Extract name (e.g. "name is John Doe", "I am Jane Smith", "under John Doe", "name: Jane")
    let name: string | null = null;
    const nameMatch =
      fullConversation.match(/(?:my\s+name\s+is|name\s*:\s*|under\s+(?:the\s+name\s+of)?|i\s+am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i) ||
      fullConversation.match(/(?:name\s+is|under)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
    if (nameMatch) {
      name = nameMatch[1].trim();
    }

    const missingDetails: string[] = [];
    if (!guestCount) missingDetails.push('number of guests');
    if (!date) missingDetails.push('preferred date');
    if (!time) missingDetails.push('preferred time');
    if (!name) missingDetails.push('your full name');
    if (!phone && !email) missingDetails.push('a contact phone number or email');

    if (missingDetails.length > 0) {
      const knownPieces: string[] = [];
      if (name) knownPieces.push(`Guest: ${name}`);
      if (guestCount) knownPieces.push(`Party: ${guestCount} guests`);
      if (date) knownPieces.push(`Date: ${date}`);
      if (time) knownPieces.push(`Time: ${time}`);
      if (phone || email) knownPieces.push(`Contact: ${phone || email}`);

      return {
        reply: `I would be happy to assist you with booking a table at MiniKitchen! ${
          knownPieces.length > 0 ? `So far I have note of (${knownPieces.join(', ')}). ` : ''
        }To complete your reservation request, could you please provide: **${missingDetails.join(', ')}**?`,
        modelUsed: 'MiniKitchen Concierge AI',
      };
    }

    // All details collected -> create Pending reservation
    const newReservation = await addReservation({
      guestName: name || 'Valued Guest',
      phone: phone || '',
      email: email || '',
      date: date || new Date().toISOString().split('T')[0],
      time: time || '19:00',
      guestCount: guestCount || 2,
      specialRequests: 'Booked via MiniKitchen AI Concierge chat',
      status: 'Pending', // ALWAYS Pending per spec
      source: 'ai_chatbot',
    });

    const reply = `Wonderful, ${newReservation.guestName}! I have recorded your table booking request.

📋 **Reservation Details**:
- **Guest Name**: ${newReservation.guestName}
- **Party Size**: ${newReservation.guestCount} guests
- **Date & Time**: ${newReservation.date} at ${newReservation.time}
- **Contact**: ${phone || email}
- **Reference ID**: \`${newReservation.id}\`
- **Status**: ⏳ **PENDING**

⚠️ **Important Confirmation Notice**:
Your reservation request is currently **PENDING** and visible inside our admin dashboard. It has **NOT** been confirmed yet. Our host team will review our dining room floor plan and contact you shortly to confirm your table!`;

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
