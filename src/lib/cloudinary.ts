// Cloudinary direct upload utility for browser
export const uploadToCloudinary = async (
  file: File,
  options: {
    folder?: string;
    public_id?: string;
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
  } = {}
): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dg9paem89';
  // Use the preset you created in Cloudinary dashboard
  const uploadPreset = 'providershub'; // Your unsigned preset name

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  if (options.folder) {
    formData.append('folder', options.folder);
  }

  if (options.public_id) {
    formData.append('public_id', options.public_id);
  }

  const resourceType = options.resourceType || 'auto';

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorData}`);
    }

    const result = await response.json();
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

// Test function to check if Cloudinary is accessible (simplified)
export const testCloudinaryConnection = async (): Promise<boolean> => {
  try {
    // Simple test - try to access Cloudinary's main endpoint
    const response = await fetch('https://api.cloudinary.com/v1_1/test/ping', {
      method: 'HEAD'
    });
    return true; // If we get here, network is working
  } catch {
    return false;
  }
};
