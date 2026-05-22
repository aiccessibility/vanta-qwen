'use client';

import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AssistantService } from '@/features/assistant/assistant.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Loader2, TrendingUp, AlertCircle, Euro, FileText } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'insight' | 'alert' | 'summary';
  data?: any;
  timestamp: string;
}

interface Insight {
  type: 'spending_alert' | 'cash_flow' | 'tax_reminder' | 'category_suggestion';
  title: string;
  message: string;
  icon: any;
  action?: string;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();
  const assistantService = new AssistantService(supabase);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Cargar historial de chat
      const history = await assistantService.getChatHistory();
      setMessages(history);

      // Cargar insights proactivos
      const proactiveInsights = await assistantService.getProactiveInsights();
      setInsights(proactiveInsights);

      // Si no hay mensajes, añadir saludo inicial
      if (history.length === 0) {
        const welcomeMessage: Message = {
          id: 'welcome',
          role: 'assistant',
          content: '¡Hola! Soy tu asistente financiero inteligente. Puedo ayudarte a analizar tus transacciones, responder preguntas sobre tus impuestos, categorizar gastos o darte insights sobre tu salud financiera. ¿En qué puedo ayudarte hoy?',
          type: 'text',
          timestamp: new Date().toISOString(),
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Error loading assistant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      type: 'text',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Guardar mensaje del usuario
      await assistantService.saveMessage(userMessage);

      // Obtener respuesta de la IA
      const response = await assistantService.sendMessage(input.trim());

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        type: response.type,
        data: response.data,
        timestamp: new Date().toISOString(),
      };

      // Guardar respuesta y actualizar estado
      await assistantService.saveMessage(assistantMessage);
      setMessages(prev => [...prev, assistantMessage]);

      // Si hay nuevos insights, actualizarlos
      if (response.newInsights) {
        const newInsights = await assistantService.getProactiveInsights();
        setInsights(newInsights);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, ha ocurrido un error al procesar tu solicitud. Por favor, inténtalo de nuevo.',
        type: 'text',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    setInput(action);
    // Pequeño delay para que el usuario vea que se ha rellenado el input
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
      handleSendMessage(fakeEvent);
    }, 100);
  };

  const renderMessageContent = (message: Message) => {
    if (message.type === 'insight' && message.data) {
      return (
        <div className="space-y-3">
          <p className="text-sm">{message.content}</p>
          {message.data.transactions && (
            <div className="bg-muted/50 rounded-md p-3 space-y-2">
              {message.data.transactions.slice(0, 3).map((tx: any, idx: number) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="font-medium">{tx.merchant}</span>
                  <span>{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(tx.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (message.type === 'summary' && message.data) {
      return (
        <div className="space-y-3">
          <p className="text-sm">{message.content}</p>
          <div className="grid grid-cols-2 gap-2">
            {message.data.metrics && Object.entries(message.data.metrics).map(([key, value]: [string, any]) => (
              <div key={key} className="bg-muted/50 rounded-md p-2 text-center">
                <div className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</div>
                <div className="font-bold text-sm">
                  {typeof value === 'number' 
                    ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)
                    : value}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return <p className="text-sm">{message.content}</p>;
  };

  const quickActions = [
    "¿Cuáles son mis gastos este mes?",
    "¿Cuánto IVA tengo que pagar?",
    "Analiza mis gastos por categoría",
    "¿Hay alguna factura sin categorizar?",
  ];

  if (loading && messages.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Asistente IA</h1>
        <p className="text-muted-foreground mt-1">Tu asistente financiero inteligente potenciado por IA</p>
      </div>

      {/* Insights Proactivos */}
      {insights.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {insights.map((insight, idx) => (
            <Card key={idx} className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-white rounded-full shadow-sm">
                    <insight.icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-blue-900">{insight.title}</h4>
                    <p className="text-xs text-blue-700 mt-1">{insight.message}</p>
                    {insight.action && (
                      <Button 
                        variant="link" 
                        className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800 mt-2"
                        onClick={() => handleQuickAction(insight.action!)}
                      >
                        {insight.action}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div
                  className={`flex-shrink-0 p-2 rounded-full ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {renderMessageContent(message)}
                  <div
                    className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString('es-ES', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 p-2 rounded-full bg-muted text-muted-foreground">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length < 3 && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-1.5 px-3"
                    onClick={() => handleQuickAction(action)}
                    disabled={loading}
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-4 border-t bg-background">
            <div className="flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pregunta algo sobre tus finanzas..."
                disabled={loading}
                className="flex-1"
              />
              <Button type="submit" disabled={loading || !input.trim()}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
