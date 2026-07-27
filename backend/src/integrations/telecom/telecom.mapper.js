function resolveNextStep (currentStatus){
    const lowblanceStatus = ['pending', 'parking', 'grace']
    const newUserStatus = ['new', 'unsub']
    const activeStatus = ['active', 'demo']
    
    if(lowblanceStatus.includes(currentStatus)){
        return 'LOW_BLANCE'
    } 

    if(newUserStatus.includes(currentStatus)) {
        return 'SHOW_PLAN_PAGE'
    }
    if(activeStatus.includes(currentStatus)) {
        return 'AUTH_OTP_LOGIN'
    }
    return 'SHOW_PLAN_PAGE'
}

function issuccess(responseCode) {
    return responseCode === '0' || responseCode === 0; 
}

module.exports = {
    resolveNextStep,
    issuccess
}