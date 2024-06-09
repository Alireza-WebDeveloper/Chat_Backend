import jwt from 'jsonwebtoken';

class AuthMiddleware {
  VerifyToken = async (req, res, next) => {
    try {
      // 1 )  Extract token
      const token = req.cookies['auth_token'];

      // 2 )  Check if token exists
      if (!token) {
        return res.status(401).json({ message: 'Unauthorized: Missing token' });
      }

      // 3 )  Verify the token using JWT library
      const decodedToken = jwt.verify(token, 'YOUR_SECRET_KEY');

      // 4 )  Attach decoded user information to request object (optional)
      req.user = decodedToken;

      // 5 )  If token is valid, proceed to next middleware
      next();
    } catch (err) {
      // Result )  Handle invalid token or other errors
      next(err);
    }
  };
  VerifySession = async (req, res, next) => {
    next();
  };
}

export default AuthMiddleware;
