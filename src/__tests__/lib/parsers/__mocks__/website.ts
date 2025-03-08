// Mock implementation of the website parser
export const parseWebsiteType = jest.fn((line) => {
  // Extract URL from the line if present
  const urlMatch = line.match(/https?:\/\/[^\s\]]+/);
  const url = urlMatch ? urlMatch[0] : 'https://example.com';

  // Return a simple website object with the extracted URL
  return {
    url,
    type: 'personal',
    label: 'Website',
  };
});
