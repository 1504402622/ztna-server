package cn.glfs.ztna.domain.authorization.login.service.strategy;

import cn.glfs.ztna.domain.authorization.login.event.LoginResult;

import javax.security.auth.login.LoginContext;

public interface LoginStrategy {
    LoginResult login(LoginContext context);
}
