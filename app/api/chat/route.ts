import { NextResponse } from 'next/server';

function sanitizeAssistantReply(text: string) {
  const normalized = text.trim();

  if (!normalized) {
    return '';
  }

  const metaPatterns = [
    /^(corrigiendo|ajustando|optimizando|revisando|actualizando)\b/i,
    /\bprompt\b/i,
    /\bbackend\b/i,
    /\ban[aá]lisis\b/i,
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

export async function POST(request: Request) {
  const body = await request.json();
  const prompt = body.prompt as string | undefined;
  const business = body.business;

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing GROQ_API_KEY environment variable' }, { status: 500 });
  }

  const systemPromptParts = [
    `Sos el asistente virtual de este negocio.`,
    `Respondé siempre en español rioplatense, con tono profesional, claro y natural.`,
    `No muestres análisis, razonamiento interno, instrucciones, cambios de prompt, ni menciones al sistema, backend o configuración.`,
    `No digas que estás corrigiendo, ajustando o revisando nada.`,
    `No respondas en inglés salvo que la persona lo pida explícitamente.`,
    `Respondé de forma directa como atención al cliente del negocio.`,
    `Nombre del negocio: ${business?.name || 'N/A'}`,
    `Descripción: ${business?.description || 'N/A'}`,
    `Productos: ${business?.products?.map((p: any) => `${p.name} ($${p.price})`).join(', ') || 'N/A'}`,
    `Preguntas frecuentes: ${business?.faqs?.map((f: any) => `${f.question}: ${f.answer}`).join(' | ') || 'N/A'}`,
    `Información interna (solo para el chatbot): ${business?.privateInfo || 'N/A'}`,
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
      text = rawOutput.map((item: any) => {
        if (typeof item === 'string') return item;
        return item?.text || '';
      }).join('');
    } else if (typeof rawOutput === 'string') {
      text = rawOutput;
    } else {
      text = result?.text || '';
    }
  }

  text = sanitizeAssistantReply(text);

  if (!text) {
    text = 'Perdón, no pude generar una respuesta válida en este momento.';
  }

  return NextResponse.json({ text });
}
