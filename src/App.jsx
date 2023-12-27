import React, { useState } from "react";
import axios from 'axios';
import './App.css';

function App() {
  const options = [
    {value: 'es', text: 'Spanish'},
    {value: 'fr', text: 'French'},
    {value: 'it', text: 'Italian'},
    {value: 'en', text: 'English'},
  ];
   const [file, setFile] = useState()
   const [Resp, setResp] = useState()
   const [selected, setSelected] = useState(options[0].value);
   const [message,setMessage]=useState(false)
  function handleChange(event) {
    setFile(event.target.files[0])
  }
  const handleSelect = event => {
    console.log(event.target.value);
    setSelected(event.target.value);
  };
  function handleSubmit(event) {
    setResp(undefined)
    setMessage(true)
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
      console.log(Resp)
      console.log(x)
      sleep(1000).then(() => { setResp(x);console.log("wakeup!!!");setMessage(false) });
        })

  }
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
   <div className="center">
   {
    Resp === undefined ? null
      :<video width="250" controls>
        <source src={Resp} type="video/mp4" />
        Sorry, your browser doesn't support videos.
       </video>
   }
   {
    message === true?
    <div className="loader"></div>
    : null
   }
   </div>
</div>
);
}

export default App;
