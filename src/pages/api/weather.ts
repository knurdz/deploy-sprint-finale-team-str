export async function GET() {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const city = process.env.OPENWEATHER_CITY || 'Colombo';
  
    const weatherStatus = {
      task: 'T07',
      provider: 'openweather',
      city: city,
      keyExposed: false,
    };
  
    if (!apiKey) {
      return new Response(
        JSON.stringify({ ...weatherStatus, error: 'API key missing' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
      );
      const data = await res.json();
  
      return new Response(
        JSON.stringify({ ...weatherStatus, data }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ ...weatherStatus, error: 'Fetch failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }