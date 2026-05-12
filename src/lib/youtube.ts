import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/youtube/callback`
);

export const getAuthUrl = (state?: string) => {
  const scopes = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true,
    state
  });
};

export const getTokens = async (code: string) => {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

export const uploadVideo = async (tokens: any, videoData: { title: string, description: string, url: string }) => {
  oauth2Client.setCredentials(tokens);
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

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
        tags: ['sermon', 'church', 'vesper']
      },
      status: {
        privacyStatus: 'public', // Or 'unlisted'
        selfDeclaredMadeForKids: false
      }
    },
    media: {
      body: Buffer.from(buffer)
    }
  });

  return res.data;
};
