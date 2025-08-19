package cn.glfs.ztna.domain.authorization.login.service.strategy.factory;

import cn.glfs.ztna.domain.authorization.login.annotation.LoginHandler;
import cn.glfs.ztna.domain.authorization.login.service.strategy.LoginStrategy;
import org.springframework.core.annotation.AnnotationUtils;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;


public class LoginStrategyFactory {

    public Map<String, LoginStrategy> loginStrategyMap = new ConcurrentHashMap<>();

    public LoginStrategyFactory () {

    }

    public LoginStrategyFactory (List<LoginStrategy> loginStrategies){
        loginStrategies.forEach(loginStrategy -> {
            LoginHandler handler = AnnotationUtils.findAnnotation(loginStrategy.getClass(), LoginHandler.class);
            if(null != handler){
                loginStrategyMap.put(handler.loginMode().getCode(), loginStrategy);
            }
        });
    }

    public LoginStrategy getLoginStrategy(String loginMode){
        return loginStrategyMap.get(loginMode);
    }




}
