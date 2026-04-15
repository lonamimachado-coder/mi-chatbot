# Chatbot para Negocios - Uruguay

Esta aplicación permite a los dueños de negocios crear chatbots gratuitos para sus empresas sin necesidad de programar. Los chatbots pueden responder consultas de clientes y procesar ventas automáticamente, integrando pagos a través de Prex Teen.

## Características

- **Registro y Autenticación**: Los dueños de negocios pueden registrarse e iniciar sesión.
- **Configuración del Negocio**: Agregar información del negocio, productos y preguntas frecuentes.
- **Chatbot Automático**: Interfaz de chat para clientes que responde preguntas y facilita compras.
- **Procesamiento de Pagos**: Integración simulada con Prex Teen para pagos (requiere API real de Prex para producción).
- **Recibos**: Generación de recibos para transacciones.
- **Comisión de Plataforma**: 1% de comisión por transacción.

## Tecnologías Utilizadas

- **Next.js**: Framework de React para el frontend.
- **Firebase**: Autenticación, base de datos (Firestore) y hosting.
- **Tailwind CSS**: Estilos profesionales.
- **TypeScript**: Tipado fuerte.

## Instalación y Ejecución

1. Clona el repositorio.
2. Instala las dependencias: `npm install`
3. Configura Firebase: Agrega tu configuración en `lib/firebase.ts`
4. Ejecuta el servidor de desarrollo: `npm run dev`
5. Abre [http://localhost:3000](http://localhost:3000)

## Integración con Prex Teen

La integración actual es simulada. Para producción, obtén la documentación de la API de Prex Teen y reemplaza las funciones de pago en el código.

Cuenta de Prex: 1851289

## Configurar la API key de Groq

1. Crea un archivo `.env.local` en la raíz del proyecto.
2. Copia el contenido de `.env.local.example`.
3. Asigna tu API key de Groq a la variable:

```env
GROQ_API_KEY=tu_api_key_de_groq
```

La ruta del chatbot usará este valor en el endpoint `app/api/chat/route.ts`.

## Despliegue

Esta aplicación requiere un servidor Node.js. **GitHub Pages no funciona** porque solo soporta sitios estáticos.

### Opción 1: Vercel (Recomendado - Gratis)

1. Sube el proyecto a GitHub
2. Ve a https://vercel.com
3. Conecta tu repositorio de GitHub
4. Agrega la variable de entorno:
   - `GROQ_API_KEY=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`
5. Haz clic en "Deploy"

Tu app estará disponible públicamente en una URL como `https://mi-chatbot.vercel.app`

### Opción 2: Netlify (También Gratis)

1. Sube a GitHub
2. Ve a https://netlify.com
3. Conecta tu repositorio
4. Configura variables de entorno y deploy

### Opción 3: Railway, Heroku, AWS, etc.

Todos soportan Next.js. Lee más en [DEPLOYMENT.md](DEPLOYMENT.md)
