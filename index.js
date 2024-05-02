// 필요한 모듈들을 불러옵니다.
const cookieParser = require('cookie-parser')
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const posts = require('./posts')

const app = express();

// 사용자 인증 라우트
const secretText = 'superSecret';
const refreshSecretText = 'refreshSecret';

let refreshTokens = []

app.use(express.json());
app.use(cookieParser());

app.post('/login', (req,res) => {
    const username = req.body.username;
    const user = { name : username };

    // jwt를 이용해서 accessToken 생성
    const accessToken = jwt.sign(user,
        secretText, 
        {expiresIn : '30s'});

    // jwt를 이용해서 refreshToken 생성
    const refreshToken = jwt.sign(user,
        refreshSecretText,
        {expiresIn : '1d' });
    
    refreshTokens.push(refreshToken);

    // refreshToken을 cookie에 넣어주기
    res.cookie('jwt', refreshToken,{
        httpOnly : true,
        maxAge : 24 * 60 * 60 * 1000 // 하루
    })

    res.json({accessToken : accessToken})
})

app.get('/posts', authMiddleware, (req, res) => {
    res.json(posts)
})


// 보호된 라우트
function authMiddleware(req, res, next){
    // 토큰을 request Headers에서 가져오기
    const authHeader = req.headers['authorization'];

    const token = authHeader && authHeader.split(' ')[1];

    
    // 토큰이 없으면 return 401 / 에러처리 1
    if(token == null) return res.sendStatus(401);

    // 유효한 토큰인지 확인
    jwt.verify(token, secretText, (err, user) => {
        // 에러처리 2
        if(err) return res.sendStatus(403);
        req.user = user;
        next();
    })
}


app.get('/refresh', (req, res) => {
    const cookies = req.cookies;
    // 쿠키가 있는지 확인하고 없으면 상태코드 403 응답
    if(!cookies?.jwt) return res.sendStatus(403);

    const refreshToken = cookies.jwt;
    // refreshTokens에 refreshToken이 포함되어있는지 확인 후 없으면 상태코드 403 응답
    if(!refreshTokens?.includes(refreshToken)){
        return res.sendStatus(403);
    }

    jwt.verify(refreshToken, refreshSecretText, (err, user) => {
        if(err) return res.sendStatus(403);
        
        // refreshToken(payload)과 refreshSecretText가 유효하면 accessToken 재발급 
        const accessToken = jwt.sign({name : user.name},
            secretText,
            {expiresIn: '30s' }
        )
        res.json({ accessToken })
            
    })
})

// 서버가 4000번 포트에서 듣기를 시작합니다. 서버가 시작되면 콘솔에 메시지를 출력합니다.
// 포트 4040으로 바꿧어요
const port = 4040;

app.listen(port, () => {
    console.log(`listening on port ${port}`);
});
