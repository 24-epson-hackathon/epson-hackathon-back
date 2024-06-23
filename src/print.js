const HOST = 'https://api.epsonconnect.com';
const API_BASE = `${HOST}/api/1/printing`;

const DEVICE_EMAIL = 'o3o.o3o@print.epsonconnect.com';

const CLIENT_ID = '9fe3efce92b64485acc7e31809abaea9';
const CLIENT_SECRET =
  'gELqz6Eyiu9cDH0HajhX5ml1J13GG3Lji9bVCVBuUXBr29Z1bxZoiYv4SLwzmb0b';

// 1. Authentication

const AUTH_URI = `${API_BASE}/oauth2/auth/token?subject=printer`;

const getAuth = async () => {
  const data = {
    grant_type: 'password',
    username: DEVICE_EMAIL,
    password: '',
  };
  const body = Object.entries(data)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

  const auth = `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`;
  const response = await fetch(AUTH_URI, {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Failed to authenticate: ${extractErrorMessage(response)}`);
  }

  return await response.json();
};

// 2. Create Print Job

const createPrintJob = async ({ subject_id, access_token }) => {
  const jobUri = `${API_BASE}/printers/${subject_id}/jobs`;

  const data = {
    job_name: `SampleJob${Date.now()}`,
    print_mode: 'document',
    print_setting: {
      media_size: 'ms_a4',
      media_type: 'mt_plainpaper',
      borderless: false,
      print_quality: 'high',
      source: 'auto',
      color_mode: 'color',
      reverse_order: false,
      copies: 1,
      collate: true,
    },
  };

  const auth = `Bearer ${access_token}`;
  const response = await fetch(jobUri, {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to create print job: ${extractErrorMessage(response)}`,
    );
  }

  return await response.json();
};

// 3. Upload Print File

const uploadPrintFile = async (text, fileName, { upload_uri }) => {
  const file = createFileFromText(text, fileName);
  const uploadUriWithFileName = `${upload_uri}&File=${fileName}`;
  const fileSize = file.size;

  const response = await fetch(uploadUriWithFileName, {
    method: 'POST',
    headers: {
      'Content-Length': `${fileSize}`,
      'Content-Type': 'application/octet-stream',
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload file: ${extractErrorMessage(response)}`);
  }
};

const createFileFromText = (text, fileName) => {
  const textBlob = new Blob([text], { type: 'text/plain' });
  return new File([textBlob], fileName);
};

// 4. Execute Print Job

const executePrintJob = async ({ subject_id, access_token }, { id }) => {
  const printUri = `${API_BASE}/printers/${subject_id}/jobs/${id}/print`;

  const response = await fetch(printUri, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to execute print job: ${extractErrorMessage(response)}`,
    );
  }
};

const extractErrorMessage = response =>
  `${response.statusText}(${response.status})`;

exports.print = async (text, fileName) => {
  try {
    const auth = await getAuth();
    const printJob = await createPrintJob(auth);
    await uploadPrintFile(fileName, text, printJob);
    await executePrintJob(auth, printJob);
  } catch (error) {
    throw new Error(`Failed to print: ${error.message}`);
  }
};
