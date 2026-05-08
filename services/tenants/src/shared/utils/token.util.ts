import jwt from 'jsonwebtoken';
export const decodeAccessToken = async(token: string) =>{
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET_KEY!, (err, decoded) => {
      if (err) {
        console.error('Error decoding token:', err);
        resolve(null);
      }
      resolve(decoded);
    });
  });
} 