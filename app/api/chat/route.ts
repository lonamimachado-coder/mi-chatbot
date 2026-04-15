import { NextResponse } from 'next/server';

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
    `Eres un asistente de ventas para un negocio con esta información:`,
    `Nombre: ${business?.name || 'N/A'}`,
    `Descripción: ${business?.description || 'N/A'}`,
    `Productos: ${business?.products?.map((p: any) => `${p.name} ($${p.price})`).join(', ') || 'N/A'}`,
    `Preguntas frecuentes: ${business?.faqs?.map((f: any) => `${f.question}: ${f.answer}`).join(' | ') || 'N/A'}`,
    `Información interna: ${business?.privateInfo || 'N/A'}`,
  ];

  const requestBody = {
    model: 'groq',
    prompt: `${systemPromptParts.join('\n')}\n\nCliente: ${prompt}\nChatbot:`,
    max_tokens: 300,
  };

  const response = await fetch('https://api.groq.com/v1/ai/generate', {
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
  const rawOutput = result?.output?.[0]?.content;
  let text = '';

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

  if (!text) {
    text = 'No se obtuvo respuesta de Groq.';
  }

  return NextResponse.json({ text });
}
