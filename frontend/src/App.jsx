import React, { useEffect, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:4000";

export default function App() {
  const [file, setFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE}/documents`);
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch documents");
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type !== "application/pdf") {
      setMessage("Only PDF files are allowed");
      setFile(null);
      return;
    }
    setFile(selected);
    setMessage("");
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a PDF file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setMessage(data.message || "File uploaded successfully");
      setFile(null);
      e.target.reset();
      fetchDocuments();
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (id) => {
    window.location.href = `${API_BASE}/documents/${id}`;
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/documents/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Delete failed");
      }
      setMessage(data.message || "Document deleted");
      setDocuments((docs) => docs.filter((d) => d.id !== id));
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Failed to delete document");
    }
  };

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return "-";
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="app-root">
      <div className="app-container">
        <header className="app-header">
          <h1>Patient Document Portal</h1>
          <p className="app-subtitle">
            Upload, manage, and download patient PDF documents.
          </p>
        </header>

        <main className="app-main">
          <section className="card upload-card">
            <h2 className="card-title">Upload PDF</h2>
            <p className="card-subtitle">
              Only <strong>.pdf</strong> files are allowed.
            </p>
            <form className="upload-form" onSubmit={handleUpload}>
              <label className="file-input-label">
                <span className="file-input-text">
                  {file ? file.name : "Choose a PDF file…"}
                </span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                />
              </label>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Uploading…" : "Upload"}
              </button>
            </form>

            {message && <div className="status-banner">{message}</div>}
          </section>

          <section className="card table-card">
            <div className="table-header">
              <div>
                <h2 className="card-title">Uploaded Documents</h2>
                <p className="card-subtitle">
                  {documents.length === 0
                    ? "No documents uploaded yet."
                    : `Total: ${documents.length} document${
                        documents.length > 1 ? "s" : ""
                      }`}
                </p>
              </div>
            </div>

            {documents.length > 0 && (
              <div className="table-wrapper">
                <table className="doc-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Filename</th>
                      <th>Size</th>
                      <th>Uploaded At</th>
                      <th className="actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc, index) => (
                      <tr key={doc.id}>
                        <td>{index + 1}</td>
                        <td title={doc.filename} className="filename-cell">
                          {doc.filename}
                        </td>
                        <td>{formatSize(doc.filesize)}</td>
                        <td>
                          {doc.created_at
                            ? new Date(doc.created_at).toLocaleString()
                            : "-"}
                        </td>
                        <td className="actions-col">
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => handleDownload(doc.id)}
                          >
                            ⬇ Download
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => handleDelete(doc.id)}
                          >
                            🗑 Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
