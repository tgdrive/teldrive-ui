import axios from "feaxios";

const http = axios.create({
  timeout: 180 * 1000,
});

export default http;
