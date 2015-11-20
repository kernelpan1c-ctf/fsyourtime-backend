module.exports = {
    dbUrl: 'mongodb://localhost/fsyourtime',
    useHttps: false,
    loginUrl: function(username, password) { return 'https://campus.frankfurt-school.de/clicnetclm/loginService.do?xaction=login&username=' + username + '&password=' + encodeURIComponent(password) },
    studentInfoUrl: 'https://campus.frankfurt-school.de/clicnetclm/campusAppStudentX.do?xaction=getStudentData',
    sslKeyLocation: null,
    sslCertLocation: null
};