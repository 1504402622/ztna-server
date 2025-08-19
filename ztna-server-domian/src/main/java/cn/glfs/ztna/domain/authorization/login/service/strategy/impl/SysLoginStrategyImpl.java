package cn.glfs.ztna.domain.authorization.login.service.strategy.impl;

import cn.glfs.ztna.domain.authorization.login.annotation.LoginHandler;
import cn.glfs.ztna.domain.authorization.login.event.LoginResult;
import cn.glfs.ztna.domain.authorization.login.model.enums.LoginModel;
import cn.glfs.ztna.domain.authorization.login.service.strategy.AbstractLoginStrategy;
import cn.glfs.ztna.domain.authorization.login.service.strategy.LoginStrategy;

import javax.security.auth.login.LoginContext;


@LoginHandler(loginMode = LoginModel.DEFAULT)
public class SysLoginStrategyImpl extends AbstractLoginStrategy {

    @Override
    public LoginResult login(LoginContext context) {
        return null;
    }

}
