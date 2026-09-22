// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// @ts-ignore
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to extract Cloudinary public_id from a full URL
function extractPublicId(url: string): string {
  if (!url) return '';
  const parts = url.split('/upload/');
  if (parts.length < 2) return '';
  
  let rest = parts[1];
  // Remove version (e.g. v1612345678/)
  rest = rest.replace(/^v\d+\//, '');
  
  // Remove file extension
  const dotIndex = rest.lastIndexOf('.');
  if (dotIndex !== -1) {
    rest = rest.substring(0, dotIndex);
  }
  return rest;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();

    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
      return new Response(JSON.stringify({ error: 'Invalid Cloudinary URL' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const publicId = extractPublicId(imageUrl);
    if (!publicId) {
      return new Response(JSON.stringify({ error: 'Could not extract public ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      return new Response(JSON.stringify({ error: 'Cloudinary credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Cloudinary Admin API deletion requires Basic Auth
    const authHeader = `Basic ${btoa(`${apiKey}:${apiSecret}`)}`;
    
    // Using Admin API to delete the resource
    // DELETE /v1_1/<cloud_name>/resources/image/upload
    const cloudinaryApiUrl = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload`;
    
    const formData = new URLSearchParams();
    formData.append('public_ids[]', publicId);

    const deleteRes = await fetch(cloudinaryApiUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    if (!deleteRes.ok) {
      const errorText = await deleteRes.text();
      console.error('Cloudinary delete error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to delete from Cloudinary', details: errorText }), {
        status: deleteRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const result = await deleteRes.json();
    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Function error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
