# Guía de Despliegue

Esta aplicación Next.js requiere un servidor Node.js para funcionar correctamente con Firebase. **GitHub Pages no es compatible** porque solo soporta sitios estáticos.

## Opción Recomendada: Vercel (Gratis)

Vercel es la plataforma oficial para Next.js y es completamente gratis para uso personal.

### Pasos:

1. **Sube el proyecto a GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/tuusuario/turepositorio.git
   git branch -M main
   git push -u origin main
   ```

2. **Despliega en Vercel:**
   - Ve a https://vercel.com
   - Haz clic en "New Project"
   - Selecciona tu repositorio de GitHub
   - Vercel detectará automáticamente que es un proyecto Next.js
   - Agrega las variables de entorno:
     - `GROQ_API_KEY=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`
   - Haz clic en "Deploy"

3. **Listo:** Tu app estará disponible en `https://tuproject.vercel.app`

## Alternativas:

- **Netlify:** https://netlify.com (también gratuito)
- **Railway:** https://railway.app (gratuito con créditos iniciales)
- **AWS Amplify:** https://aws.amazon.com/amplify

## Variables de Entorno Necesarias en Producción:

- `GROQ_API_KEY` - Tu API key de Groq
- Las configuraciones de Firebase (ya están en el código)
