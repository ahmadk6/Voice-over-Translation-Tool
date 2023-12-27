import React, { useEffect, useState } from "react";
import axios from 'axios';
import './App.css';

function App() {
   const [file, setFile] = useState()
   const [Resp, setResp] = useState()
  function handleChange(event) {
    setFile(event.target.files[0])
  }

  const options = [
    {value: 'es', text: 'Spanish'},
    {value: 'fr', text: 'French'},
    {value: 'it', text: 'Italian'},
    {value: 'en', text: 'English'},
  ];

  const [selected, setSelected] = useState(options[0].value);

  const handleSelect = event => {
    console.log(event.target.value);
    setSelected(event.target.value);
  };
  function handleSubmit(event) {
    event.preventDefault()
    const url = 'http://localhost:8000/translate';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);
    formData.append('language', selected);
    const config = {
      headers: {
        'content-type': 'multipart/form-data',
        Accept: 'video/mp4;charset=UTF-8'
      },
      responseType: 'blob'
    };
    axios.post(url, formData, config).then((response)=> {
      var x=URL.createObjectURL(response.data)   
      console.log(x)
      setResp(x);
        })

  }
    return ( 
<div className="center">
   <h1>Voice-over tool</h1>
   <label htmlFor="languages">Choose a language:  </label>
   <select name="languages" id="languages" onChange={handleSelect}>
   {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.text}
          </option>
        ))}
      </select>
   <form encType="multipart/form-data" onSubmit={handleSubmit}>
      <br />
      <label htmlFor="myfile">Select a file:</label>
      <br />
      <input type="file" id="myfile" name="myfile" onChange={handleChange}/>
      <br />
      <input className='button1' type="submit" value="Upload"/>
   </form>
   <video loop autoPlay>
    <source src={Resp} type="video/mp4" />
    Sorry, your browser doesn't support videos.
    </video>
</div>
);
}

export default App;
