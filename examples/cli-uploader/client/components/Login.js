import React from 'react';

import AuthForm from './AuthForm';

const Login = () => {
  return (
    <div>
      <AuthForm buttonText="login" action={'/api/login'} title="Login" />
      <AuthForm
        buttonText="create account"
        action="/api/register"
        title="Create account"
      />
    </div>
  );
};

export default Login;
