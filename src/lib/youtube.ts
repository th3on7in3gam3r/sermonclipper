import { createOAuthClient, youtubeFor } from '@/lib/google/youtubeClient';

export const getAuthUrl = (state?: string) => {
  const scopes = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/yt-analytics.readonly',
  ];

  return createOAuthClient().generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true,
    state,
  });
};

export const getTokens = async (code: string) => {
  const { tokens } = await createOAuthClient().getToken(code);
  return tokens;
};

export const uploadVideo = async (
  tokens: Record<string, unknown>,
  videoData: { title: string; description: string; url: string }
) => {
  const youtube = youtubeFor(tokens);

  // Download video to buffer
  const response = await fetch(videoData.url);
  const buffer = await response.arrayBuffer();

  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: videoData.title,
        description: videoData.description,
        categoryId: '22', // People & Blogs
        tags: ['sermon', 'church', 'vesper'],
      },
      status: {
        privacyStatus: 'public', // Or 'unlisted'
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: Buffer.from(buffer),
    },
  });

  return res.data;
};
