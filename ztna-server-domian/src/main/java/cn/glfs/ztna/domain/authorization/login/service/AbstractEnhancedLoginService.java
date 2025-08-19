package cn.glfs.ztna.domain.authorization.login.service;

import cn.glfs.ztna.domain.authorization.login.event.LoginResult;
import cn.glfs.ztna.domain.authorization.login.model.entity.loginContext;

import javax.security.auth.login.LoginContext;

public abstract class AbstractEnhancedLoginService implements EnhancedLoginService {

    LoginContext buildLoginContext() {
        return null;
    }

    protected void publishEvent(LoginResult result) {

    }
}
