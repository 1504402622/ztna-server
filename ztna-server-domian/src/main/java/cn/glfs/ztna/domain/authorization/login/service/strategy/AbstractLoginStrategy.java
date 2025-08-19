package cn.glfs.ztna.domain.authorization.login.service.strategy;

import cn.glfs.ztna.domain.authorization.login.service.vaild.LoginValidatorChain;

import javax.security.auth.login.LoginContext;

public abstract class AbstractLoginStrategy implements LoginStrategy {

    protected boolean vaild(LoginContext context) {
        LoginValidatorChain validatorChain = new LoginValidatorChain();
        validatorChain.validate(context);
        return false;
    }

}
