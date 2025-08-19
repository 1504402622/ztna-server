package cn.glfs.ztna.domain.dlp;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;

import java.util.Date;
import java.util.UUID;

public class Test {
    public static void main(String[] args) {
        // 配置参数
        String appId = "ba5b792c4e594ba9";
        String appSecret = "836543f1ce76495b8c75cc2b83ca6d10";

        // 生成JWT令牌
        String token = JWT.create()
                .withIssuer(appId)  // 设置发行人(issuer)为appid
                .withIssuedAt(new Date())  // 设置签发时间为当前时间
                .withJWTId(UUID.randomUUID().toString())  // 设置唯一标识
                .sign(Algorithm.HMAC256(appSecret));  // 使用HMAC256算法签名

        // 添加Bearer前缀
        String bearerToken = String.join(" ", "Bearer", token);

        // 输出结果
        System.out.println("生成的令牌:");
        System.out.println(bearerToken);
    }
}
