const jwt =require("jsonwebtoken")
exports.generateToken = (user) => {
    const payload = {
      userId: user.id,
      email: user.email,
      type:user.type,
      name:user.fname
      // Add other claims as needed
    };
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '10h' }); // Adjust expiration time
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '10h' }); // Adjust expiration time
    return { accessToken, refreshToken };
  };

//   const generateTokens = (user) => {
//     // const accessToken = jwt.sign({ id: user.id }, secretKey, { expiresIn: '1h' });
//     // const refreshToken = jwt.sign({ id: user.id }, refreshSecretKey, { expiresIn: '7d' });
//     return { accessToken, refreshToken };
// };