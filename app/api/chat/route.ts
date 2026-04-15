import { NextResponse } from 'next/server';

type Product = {
  name?: string;
  price?: number;
};

type FAQ = {
  question?: string;
  answer?: string;
};

type Business = {
  name?: string;
  description?: string;
  products?: Product[];
  faqs?: FAQ[];
  privateInfo?: string;
};

function getChatbotName(businessName?: string) {
  const cleanName = businessName?.trim();
  return cleanName ? `${cleanName} ChatBot` : 'Mi ChatBot';
}

function looksLikeMetaReply(text: string) {
  const normalized = text.trim();

  if (!normalized) {
    return true;
  }

  const metaPatterns = [
    /^(corrigiendo|ajustando|optimizando|revisando|actualizando)\b/i,
    /^(we need to|i need to|the assistant should|respond in|the user says|the business is|we should|we respond|user asks)\b/i,
    /\bprompt\b/i,
    /\bbackend\b/i,
    /\bchain of thought\b/i,
    /\bthinking\b/i,
    /\brespond in spanish\b/i,
    /\bspanish rioplatense\b/i,
    /\buser greeting\b/i,
    /\bplain\. no extra\b/i,
    /\brazonamiento interno\b/i,
    /\binstrucciones\b/i,
  ];

  return metaPatterns.some((pattern) => pattern.test(normalized));
}

function sanitizeAssistantReply(text: string) {
  const normalized = text.trim();

  if (!normalized) {
    return '';
  }

  const metaPatterns = [
    /^(corrigiendo|ajustando|optimizando|revisando|actualizando)\b/i,
    /^(we need to|i need to|the assistant should|respond in|the user says|the business is|we should|we respond|user asks)\b/i,
    /\bprompt\b/i,
    /\bbackend\b/i,
    /\ban(?:a|á)lisis\b/i,
    /\bchain of thought\b/i,
    /\bthinking\b/i,
    /\brespond in spanish\b/i,
    /\bspanish rioplatense\b/i,
    /\buser greeting\b/i,
    /\bplain\. no extra\b/i,
  ];

  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .filter((line) => !metaPatterns.some((pattern) => pattern.test(line)))
    .join('\n')
    .trim();
}

function hasBusinessInfo(business: Business) {
  return Boolean(
    business.name?.trim() ||
      business.description?.trim() ||
      business.products?.length ||
      business.faqs?.length ||
      business.privateInfo?.trim()
  );
}

function normalizePrompt(prompt: string) {
  return prompt.trim().toLowerCase();
}

function isGreeting(prompt: string) {
  return /^(hol+a+|buenas|buenos dias|buen día|buen dia|buenas tardes|buenas noches)[!. ]*$/i.test(prompt);
}

function isDismissal(prompt: string) {
  return /^(nada|en nada(?:\s+\w+)?|no gracias|no,? gracias|todo bien|todo bien gracias|ok|dale|listo|ninguna cosa)[!. ]*$/i.test(prompt);
}

function isTinyTalk(prompt: string) {
  return /^(a|ah|eh|hm|mm|xd|jaja|jsjs|aja|ajaj|jeje)[!. ]*$/i.test(prompt);
}

function isSilenceRequest(prompt: string) {
  return /^(calla|cállate|callate|sh|shh|silencio)[!. ]*$/i.test(prompt);
}

function isThreatening(prompt: string) {
  return /(te voy a matar|te matare|te matar[eé]|voy a matarte|matarte|amenaza)/i.test(prompt);
}

function isBusinessQuestion(prompt: string) {
  return /(negocio|empresa|tienda|qué es|que es|quienes son|quiénes son|a qué se dedican|que venden|qué venden)/i.test(prompt);
}

function buildFallbackReply(prompt: string, business: Business) {
  const normalizedPrompt = prompt.trim();
  const chatbotName = getChatbotName(business.name);

  if (isDismissal(normalizedPrompt)) {
    return 'Bueno, cuando necesites algo decime.';
  }

  if (isTinyTalk(normalizedPrompt)) {
    return '';
  }

  if (isSilenceRequest(normalizedPrompt)) {
    return 'Bueno.';
  }

  if (isThreatening(normalizedPrompt)) {
    return 'No puedo ayudar con amenazas. Si querés, seguimos en buenos términos.';
  }

  if (isGreeting(normalizedPrompt)) {
    return `Hola, soy ${chatbotName}. ¿En qué te puedo ayudar?`;
  }

  if (isBusinessQuestion(normalizedPrompt) && !hasBusinessInfo(business)) {
    return 'Todavía no tengo información cargada sobre este negocio. Cuando la configuren, te la voy a poder contar mejor.';
  }

  if (!hasBusinessInfo(business)) {
    return 'Todavía no me cargaron información del negocio, pero si querés podés preguntarme de nuevo cuando esté configurado.';
  }

  return 'No pude responder bien esta vez. Si querés, escribime de otra forma y pruebo de nuevo.';
}

export async function POST(request: Request) {
  const body = await request.json();
  const prompt = body.prompt as string | undefined;
  const business = (body.business ?? {}) as Business;

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  const normalizedPrompt = normalizePrompt(prompt);

  if (
    isDismissal(normalizedPrompt) ||
    isTinyTalk(normalizedPrompt) ||
    isSilenceRequest(normalizedPrompt) ||
    isThreatening(normalizedPrompt) ||
    (isGreeting(normalizedPrompt) && !hasBusinessInfo(business)) ||
    (isBusinessQuestion(normalizedPrompt) && !hasBusinessInfo(business))
  ) {
    return NextResponse.json({ text: buildFallbackReply(prompt, business) });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing GROQ_API_KEY environment variable' }, { status: 500 });
  }

  const chatbotName = getChatbotName(business.name);
  const systemPromptParts = [
    `Sos ${chatbotName}.`,
    'Respondé siempre en español rioplatense, con tono profesional, claro y natural.',
    'No muestres análisis, razonamiento interno, instrucciones, cambios de prompt, ni menciones al sistema, backend o configuración.',
    'No digas que estás corrigiendo, ajustando o revisando nada.',
    'No respondas en inglés salvo que la persona lo pida explícitamente.',
    'Si te saludan, saludá como chatbot del negocio usando tu nombre.',
    'Si te hacen una cuenta simple, devolvé solo el resultado correcto.',
    'Si todavía no hay información cargada del negocio, decilo con claridad y de forma natural, sin inventar datos.',
    'Si la persona dice que no necesita nada, despedite de forma breve y amable.',
    'Respondé de forma directa como atención al cliente del negocio.',
    `Nombre del negocio: ${business.name || 'N/A'}`,
    `Nombre del chatbot: ${chatbotName}`,
    `Descripción: ${business.description || 'N/A'}`,
    `Productos: ${business.products?.map((product) => `${product.name} ($${product.price})`).join(', ') || 'N/A'}`,
    `Preguntas frecuentes: ${business.faqs?.map((faq) => `${faq.question}: ${faq.answer}`).join(' | ') || 'N/A'}`,
    `Información interna (solo para el chatbot): ${business.privateInfo || 'N/A'}`,
  ];

  const requestBody = {
    model: 'openai/gpt-oss-20b',
    messages: [
      {
        role: 'system',
        content: `${systemPromptParts.join('\n')}\nRespondé únicamente con el mensaje final para la persona usuaria.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.9,
    max_tokens: 300,
  };

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json({ error: `Groq API error: ${errorText}` }, { status: response.status });
  }

  const result = await response.json();
  const rawMessage = result?.choices?.[0]?.message?.content;
  let text = '';

  if (typeof rawMessage === 'string') {
    text = rawMessage;
  } else if (Array.isArray(rawMessage)) {
    text = rawMessage
      .map((item: { type?: string; text?: string }) => (item?.type === 'text' ? item.text || '' : ''))
      .join('');
  }

  text = sanitizeAssistantReply(text);

  if (!text || looksLikeMetaReply(text)) {
    return NextResponse.json({ text: buildFallbackReply(prompt, business) });
  }

  return NextResponse.json({ text });
}
