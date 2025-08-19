package cn.glfs.ztna.domain.authorization.login.model.enums;

public enum LoginModel {
        DEFAULT("DEFAULT", "默认登录");

        private String code;
        private String info;
        
        
        LoginModel(String code,String info){
            this.code = code;
            this.info = info;
        }
        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getInfo() {
            return info;
        }

        public void setInfo(String info) {
            this.info = info;
        }
    }