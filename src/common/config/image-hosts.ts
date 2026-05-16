export const getAllowedImageHosts = (): Set<string> => {
  const configuredHosts = (process.env.ALLOWED_IMAGE_HOSTS || '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  return new Set(
    configuredHosts.length > 0 ? configuredHosts : ['res.cloudinary.com'],
  );
};
