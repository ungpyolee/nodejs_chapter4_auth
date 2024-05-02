// 필요한 모듈들을 불러옵니다.
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const posts = require('./posts')

const app = express();

// 사용자 인증 라우트
const secretText = 'superSecret';
app.use(express.json())
app.post('/login', (req,res) => {
    const username = req.body.username;
    const user = { name : username };

    const accessToken = jwt.sign(user, secretText);

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




// 서버가 4000번 포트에서 듣기를 시작합니다. 서버가 시작되면 콘솔에 메시지를 출력합니다.
// 포트 4040으로 바꿧어요
const port = 4040;

app.listen(port, () => {
    console.log(`listening on port ${port}`);
});
