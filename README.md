# Webhook Test - WhatsApp and Messenger Integration

A Node.js webhook handler for WhatsApp and Messenger with AI-powered responses using Groq.

## Features

- WhatsApp webhook integration
- Messenger webhook integration
- AI-powered responses via Groq
- Multi-platform message handling
- Intent detection and routing

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
4. Fill in your actual values in the `.env` file:
   - WhatsApp Business API credentials
   - Messenger API credentials
   - Groq API key

## Configuration

### WhatsApp Setup
- Get your WhatsApp Business API token
- Configure webhook URL: `https://yourdomain.com/webhook/whatsapp`
- Set verify token in your WhatsApp app settings

### Messenger Setup
- Get your Facebook Messenger token
- Configure webhook URL: `https://yourdomain.com/webhook/messenger`
- Set verify token in your Messenger app settings

### Groq AI Setup
- Sign up at [Groq Console](https://console.groq.com/)
- Get your API key
- Add it to your `.env` file

## Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## Deployment

### Deploy to Heroku
1. Install Heroku CLI
2. Login to Heroku: `heroku login`
3. Create app: `heroku create your-app-name`
4. Set environment variables:
   ```bash
   heroku config:set WHATSAPP_TOKEN=your_token
   heroku config:set MESSENGER_TOKEN=your_token
   heroku config:set GROQ_API_KEY=your_key
   # ... add all other environment variables
   ```
5. Deploy: `git push heroku main`

### Deploy to Railway
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Railway will automatically deploy on git push

### Deploy to Render
1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Choose Node.js environment
4. Set build command: `npm install`
5. Set start command: `npm start`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3000) | No |
| `WHATSAPP_TOKEN` | WhatsApp Business API token | Yes |
| `WHATSAPP_VERIFY_TOKEN` | WhatsApp webhook verify token | Yes |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp phone number ID | Yes |
| `MESSENGER_TOKEN` | Facebook Messenger token | Yes |
| `MESSENGER_VERIFY_TOKEN` | Messenger webhook verify token | Yes |
| `GROQ_API_KEY` | Groq API key for AI responses | Yes |
| `NODE_ENV` | Environment (development/production) | No |

## API Endpoints

- `GET /` - Health check
- `POST /webhook/whatsapp` - WhatsApp webhook
- `GET /webhook/whatsapp` - WhatsApp webhook verification
- `POST /webhook/messenger` - Messenger webhook
- `GET /webhook/messenger` - Messenger webhook verification

## Project Structure

```
src/
├── app.js                 # Main application entry point
├── ai/
│   ├── groqClient.js      # Groq AI client configuration
│   └── intentEngine.js    # Intent detection and processing
├── orchestrator/
│   ├── context.js         # Context management
│   ├── index.js          # Main orchestrator
│   └── router.js         # Request routing
├── services/
│   └── reply.js          # Reply service
├── webhooks/
│   ├── messenger.js      # Messenger webhook handler
│   └── whatsapp.js       # WhatsApp webhook handler
└── whatsapp/
    └── sendmessage.js    # WhatsApp message sending
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.