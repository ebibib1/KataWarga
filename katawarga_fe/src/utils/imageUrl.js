// Utility function untuk generate URL gambar dari filename
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // Gunakan Next.js API route untuk proxy gambar
  return `/api/image-proxy?path=${encodeURIComponent(imagePath)}`;
};