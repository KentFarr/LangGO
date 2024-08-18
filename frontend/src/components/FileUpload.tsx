import React, { ChangeEvent, useState } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { initializeApp } from 'firebase/app';
import firebaseConfig from '../firebaseConfig';
import {v4} from 'uuid';
import { useAuth } from '../hooks/useAuth';


const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const user = useAuth();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };




  const handleUpload = () => {
    if (!file) return;

    const storageRef = ref(storage, `pdfs/${file.name + v4()}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(progress);
      },
      (error) => {
        console.error(error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setUrl(downloadURL);
          setFile(null);
          setProgress(0);
        });
      }
    );
  };

  return (
    <div>
      <h2>Upload a PDF</h2>
      <input type="file" accept=".pdf" onChange={handleChange} disabled={!user} />
      <button onClick={handleUpload} disabled={!user}>
        Upload
      </button>
      {progress > 0 && <progress value={progress} max="100" />}
      {!user && <p>You must be logged in to upload a file.</p>}
    </div>
  );
};



export default FileUpload;