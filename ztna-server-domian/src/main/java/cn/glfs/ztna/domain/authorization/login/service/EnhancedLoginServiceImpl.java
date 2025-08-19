package cn.glfs.ztna.domain.authorization.login.service;


import cn.glfs.ztna.domain.authorization.login.model.enums.LoginModel;
import cn.glfs.ztna.domain.authorization.login.model.enums.SessionType;
import cn.glfs.ztna.domain.authorization.login.model.enums.UserAgentIdEnum;
import cn.glfs.ztna.domain.authorization.login.event.LoginResult;
import cn.glfs.ztna.domain.authorization.login.model.entity.loginContext;
import cn.glfs.ztna.domain.authorization.login.service.strategy.LoginStrategy;
import cn.glfs.ztna.domain.authorization.login.service.strategy.factory.LoginStrategyFactory;
import cn.glfs.ztna.domain.authorization.login.service.vaild.LoginValidatorChain;

import javax.security.auth.login.LoginContext;
import javax.servlet.http.HttpServletRequest;

public class EnhancedLoginServiceImpl extends AbstractEnhancedLoginService {
    @Override
    public LoginResult login(HttpServletRequest request, LoginModel loginMethod, UserAgentIdEnum UserAgent, SessionType sessionType) {
        // 1. 构建登录上下文
        LoginContext loginContext = super.buildLoginContext();
        // 2. 执行 模版执行（模版模式） 登录验证链（责任链），登录结果链（责任链）
        LoginStrategyFactory loginStrategyFactory = new LoginStrategyFactory();
        LoginStrategy strategy = loginStrategyFactory.getLoginStrategy(loginMethod.getCode());
        LoginResult result = strategy.login(loginContext);
        // 3. 发布最终登录成功或失败事件
        super.publishEvent(result);
        return null;
    }
}
