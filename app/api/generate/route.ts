import { NextRequest, NextResponse } from 'next/server';
import * as fal from '@fal-ai/serverless-client';

interface GenerateRequest {
  mediaType: 'text-to-image' | 'image-to-image' | 'text-to-video' | 'image-to-video';
  prompt: string;
  aspectRatio: '1:1' | '16:9' | '9:16';
  motionStrength?: 'low' | 'medium' | 'high';
  sceneCount?: 'single' | 'multi';
  characterConsistency?: boolean;
  loopable?: boolean;
  videoDuration?: number;
  style: string;
  sourceImage?: string;
}

function getAspectRatioDimensions(ratio: string): { width: number; height: number } {
  switch (ratio) {
    case '1:1':
      return { width: 1024, height: 1024 };
    case '16:9':
      return { width: 1344, height: 768 };
    case '9:16':
      return { width: 768, height: 1344 };
    default:
      return { width: 1024, height: 1024 };
  }
}

function enhancePrompt(prompt: string, style: string, options: GenerateRequest): string {
  let enhanced = prompt;

  // Add style modifier
  const styleModifiers: Record<string, string> = {
    realistic: 'highly detailed, photorealistic, 8k quality',
    anime: 'anime style, vibrant colors, detailed illustration',
    '2d': '2D art style, flat colors, artistic illustration',
    '3d': '3D rendered, high quality CGI, detailed modeling',
    cinematic: 'cinematic lighting, film quality, dramatic composition',
    'oil-painting': 'oil painting style, textured brushstrokes, classical art',
    watercolor: 'watercolor painting style, soft colors, artistic',
  };

  if (styleModifiers[style]) {
    enhanced = `${enhanced}, ${styleModifiers[style]}`;
  }

  // Add video-specific enhancements
  if (options.mediaType === 'text-to-video' || options.mediaType === 'image-to-video') {
    if (options.motionStrength === 'high') {
      enhanced += ', dynamic motion, energetic movement';
    } else if (options.motionStrength === 'low') {
      enhanced += ', subtle motion, gentle movement';
    } else {
      enhanced += ', smooth natural motion';
    }

    if (options.characterConsistency) {
      enhanced += ', consistent character appearance throughout';
    }

    if (options.sceneCount === 'multi') {
      enhanced += ', multiple dynamic scenes, seamless transitions';
    }

    if (options.loopable) {
      enhanced += ', seamless loop, continuous motion';
    }
  }

  return enhanced;
}

async function generateWithFal(
  request: GenerateRequest
): Promise<string> {
  const FAL_KEY = process.env.FAL_KEY;

  if (!FAL_KEY) {
    throw new Error('FAL_KEY not configured. Please set FAL_KEY environment variable.');
  }

  fal.config({
    credentials: FAL_KEY,
  });

  const enhancedPrompt = enhancePrompt(request.prompt, request.style, request);
  const dimensions = getAspectRatioDimensions(request.aspectRatio);

  // Text to Image
  if (request.mediaType === 'text-to-image') {
    const result: any = await fal.subscribe('fal-ai/flux/dev', {
      input: {
        prompt: enhancedPrompt,
        image_size: {
          width: dimensions.width,
          height: dimensions.height,
        },
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
      },
      logs: false,
    });

    return result.images[0].url;
  }

  // Image to Image
  if (request.mediaType === 'image-to-image') {
    const result: any = await fal.subscribe('fal-ai/flux/dev/image-to-image', {
      input: {
        prompt: enhancedPrompt,
        image_url: request.sourceImage,
        image_size: {
          width: dimensions.width,
          height: dimensions.height,
        },
        num_inference_steps: 28,
        guidance_scale: 3.5,
        strength: 0.75,
      },
      logs: false,
    });

    return result.images[0].url;
  }

  // Text to Video
  if (request.mediaType === 'text-to-video') {
    const motionMap = { low: 127, medium: 180, high: 255 };
    const motionBucket = motionMap[request.motionStrength || 'medium'];

    const result: any = await fal.subscribe('fal-ai/fast-svd/text-to-video', {
      input: {
        prompt: enhancedPrompt,
        video_size: request.aspectRatio === '16:9' ? 'landscape_16_9' :
                   request.aspectRatio === '9:16' ? 'portrait_9_16' : 'square',
        motion_bucket_id: motionBucket,
        fps: 24,
      },
      logs: false,
    });

    return result.video.url;
  }

  // Image to Video
  if (request.mediaType === 'image-to-video') {
    const motionMap = { low: 127, medium: 180, high: 255 };
    const motionBucket = motionMap[request.motionStrength || 'medium'];

    const result: any = await fal.subscribe('fal-ai/fast-svd', {
      input: {
        image_url: request.sourceImage,
        video_size: request.aspectRatio === '16:9' ? 'landscape_16_9' :
                   request.aspectRatio === '9:16' ? 'portrait_9_16' : 'square',
        motion_bucket_id: motionBucket,
        fps: 24,
      },
      logs: false,
    });

    return result.video.url;
  }

  throw new Error('Unsupported media type');
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();

    if (!body.prompt && body.mediaType !== 'image-to-video') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if ((body.mediaType === 'image-to-image' || body.mediaType === 'image-to-video') && !body.sourceImage) {
      return NextResponse.json(
        { error: 'Source image is required for this mode' },
        { status: 400 }
      );
    }

    const result = await generateWithFal(body);

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Generation failed' },
      { status: 500 }
    );
  }
}
