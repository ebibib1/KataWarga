export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const imagePath = searchParams.get('path');
  
  if (!imagePath) {
    console.log('❌ Image proxy: Missing path parameter');
    return new Response('Missing path parameter', { status: 400 });
  }
  
  try {
    // Construct backend image URL
    const backendPort = process.env.BACKEND_PORT || '5000';
    const imageUrl = `http://localhost:${backendPort}/uploads/${imagePath}`;
    console.log('🖼️ Fetching image from backend:', imageUrl);
    
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      console.log('❌ Image not found on backend:', response.status, imageUrl);
      return new Response('Image not found', { status: 404 });
    }
    
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    console.log('✅ Image served successfully:', imagePath, `(${contentType})`);
    
    return new Response(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache 1 day
      },
    });
  } catch (error) {
    console.error('❌ Error fetching image:', error.message);
    return new Response('Error fetching image', { status: 500 });
  }
}