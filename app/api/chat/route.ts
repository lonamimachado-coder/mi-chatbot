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

function looksLikeMetaReply(text: string) {
  const normalized = text.trim();

  if (!normalized) {
    return true;
  }

  const metaPatterns = [
    /^(corrigiendo|ajustando|optimizando|revisando|actualizando)\b/i,
    /^(we need to|i need to|the assistant should|respond in)\b/i,
    /\bprompt\b/i,
    /\bbackend\b/i,
    /\bchain of thought\b/i,
    /\bthinking\b/i,
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
    /^(we need to|i need to|the assistant should|respond in)\b/i,
    /\bprompt\b/i,
    /\bbackend\b/i,
    /\ban(?:a|á)lisis\b/i,
    /\bchain of thought\b/i,
    /\bthinking\b/i,
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

function buildFallbackReply(prompt: string, business: Business) {
  const cleanPrompt = prompt.trim().toLowerCase();
  const businessName = business.name?.trim() || 'el negocio';
  const firstProduct = business.products?.find((product) => product?.name)?.name;

  if (/^(hola|buenas|buenos dias|buen día|buen dia|buenas tardes|buenas noches)[!. ]*$/i.test(cleanPrompt)) {
    return `Hola, soy el asistente de ${businessName}. ¿En qué te puedo ayudar?`;
  }

  if (firstProduct) {
    return `Gracias por tu mensaje. Te puedo ayudar con información sobre ${firstProduct} y lo que ofrece ${businessName}. Contame qué necesitás y te respondo enseguida.`;
  }

  return `Gracias por escribirnos. Soy el asistente de ${businessName}. Decime qué necesitás y te ayudo.`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const prompt = body.prompt as string | undefined;
  const business = (body.business ?? {}) as Business;

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing GROQ_API_KEY environment variable' }, { status: 500 });
  }

  const systemPromptParts = [
    'Sos el asistente virtual de este negocio.',
    'Respondé siempre en español rioplatense, con tono profesional, claro y natural.',
    'No muestres análisis, razonamiento interno, instrucciones, cambios de prompt, ni menciones al sistema, backend o configuración.',
    'No digas que estás corrigiendo, ajustando o revisando nada.',
    'No respondas en inglés salvo que la persona lo pida explícitamente.',
    'Respondé de forma directa como atención al cliente del negocio.',
    `Nombre del negocio: ${business.name || 'N/A'}`,
    `Descripción: ${business.description || 'N/A'}`,
    `Productos: ${business.products?.map((product) => `${product.name} ($${product.price})`).join(', ') || 'N/A'}`,
    `Preguntas frecuentes: ${business.faqs?.map((faq) => `${faq.question}: ${faq.answer}`).join(' | ') || 'N/A'}`,
    `Información interna (solo para el chatbot): ${business.privateInfo || 'N/A'}`,
  ];

  const requestBody = {
    model: 'openai/gpt-oss-20b',
    input: [
      {
        role: 'system',
        content: systemPromptParts.join('\n'),
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_output_tokens: 300,
  };

  const response = await fetch('https://api.groq.com/openai/v1/responses', {
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
  let text = result?.output_text || '';

  if (!text) {
    const rawOutput = result?.output?.[0]?.content;
    if (Array.isArray(rawOutput)) {
      text = rawOutput
        .map((item: { text?: string } | string) => {
          if (typeof item === 'string') return item;
          return item?.text || '';
        })
        .join('');
    } else if (typeof rawOutput === 'string') {
      text = rawOutput;
    } else {
      text = result?.text || '';
    }
  }

  text = sanitizeAssistantReply(text);

  if (!text || looksLikeMetaReply(text)) {
    text = buildFallbackReply(prompt, business);
  }

  return NextResponse.json({ text });
}
