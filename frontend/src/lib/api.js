const BASE = import.meta.env.VITE_API_URL || "";

async function request(method, path, data, opts = {}) {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const token = localStorage.getItem("via-token");
  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;

  const init = {
    method,
    headers: {
      Accept: "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(opts.headers || {}),
    },
  };
  if (!isFormData && init.headers["Content-Type"] == null) {
    init.headers["Content-Type"] = "application/json";
  }

  if (isFormData) {
    delete init.headers["Content-Type"];
    init.body = data;
  } else if (data != null) {
    init.body = JSON.stringify(data);
  }

  const res = await fetch(url, init);
  let body = null;
  try {
    body = await res.json();
  } catch (err) {
    // non-json response
  }

  if (!res.ok) {
    const message =
      body && body.message ? body.message : `Request failed: ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}

export async function post(path, data, opts) {
  return request("POST", path, data, opts);
}

export async function get(path, opts) {
  return request("GET", path, null, opts);
}

export async function patch(path, data, opts){
  return request('PATCH', path, data, opts);
}

export async function del(path, opts) {
  return request("DELETE", path, null, opts);
}

export default { post, get, patch, delete: del };
