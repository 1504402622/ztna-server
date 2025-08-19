package cn.glfs.ztna.domain.authorization.login.service;

import cn.glfs.ztna.domain.authorization.login.model.enums.AddMethodType;
import cn.glfs.ztna.domain.authorization.login.model.enums.LoginModel;
import cn.glfs.ztna.domain.authorization.login.model.enums.SessionType;
import cn.glfs.ztna.domain.authorization.login.model.enums.UserAgentIdEnum;
import cn.glfs.ztna.domain.authorization.login.event.LoginResult;

import javax.servlet.http.HttpServletRequest;

public interface EnhancedLoginService {
    public LoginResult login(HttpServletRequest request,
                             LoginModel loginMethod,
                             UserAgentIdEnum UserAgent,
                             SessionType sessionType);
}
