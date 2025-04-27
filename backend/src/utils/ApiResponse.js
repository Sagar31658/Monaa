class ApiResponse {
    constructor(statusCode, data, message = "Success") {
      this.statusCode = statusCode;
      this.data = data;
      this.message = message;
      this.success = statusCode < 400; // Any 2xx/3xx = success, others = failure
    }
  }
  
module.exports = ApiResponse;
  