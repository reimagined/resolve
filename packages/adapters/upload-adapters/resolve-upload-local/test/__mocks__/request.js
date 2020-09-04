const request = {
  put: jest.fn((args, callback) => callback()),
  post: jest.fn((args, callback) => callback()),
};

export default request;
