const submitbtn = document.getElementById('submitbtn');
const fileInput = document.getElementById('file-input');
const error = document.getElementById('error');
const nameEmailError = document.getElementById('nameEmailError');

//!  json parser use whereever needed
// function parseJsonSafely(stringData) {
//     let parsedJson;
//     try {
//         parsedJson = JSON.parse(stringData);
//     } catch (err) {
//         console.log(err);
//     }
//     return parsedJson;
// }

let photoUrl;

function uploadFile(file, signedRequest, url) {
    fetch(signedRequest, {
        method: 'PUT',
        body: file,
    })
        .then(() => {
            document.getElementById('preview').src = url;
            photoUrl = url;
        })
        .catch((err) => {
            console.log(err);
        });
}

function getSignedRequest(file) {
    fetch(`/sign-s3?file-name=${file.name}&file-type=${file.type}`)
        .then(res => res.json())
        .then((data) => {
            // console.log('signed data:', data);
            uploadFile(file, data.signedRequest, data.url);
        })
        .catch((err) => {
            console.log(err);
        });
}


function updateDom(data) {
    const contestantData = document.getElementById('contestantData');
    const div = document.createElement('div');

    const div1 = document.createElement('div');
    const para = document.createElement('p');
    para.textContent = data.name;
    div1.appendChild(para);
    div.appendChild(div1);

    const div2 = document.createElement('div');
    const image = document.createElement('img');
    image.style.width = '300px';
    image.style.height = '300';
    image.src = data.photoUrl;
    div2.appendChild(image);
    div.appendChild(div2);

    const div3 = document.createElement('div');
    const btn = document.createElement('input');
    btn.type = 'button';
    btn.value = 'vote';
    btn.className = 'votingBtn';
    btn.setAttribute('participantid', data._id); //eslint-disable-line
    div3.appendChild(btn);
    div.appendChild(div3);

    //! dom navigated to here to update votecount, dnt chnge its pos
    const div4 = document.createElement('div');
    const para2 = document.createElement('p');
    para2.textContent = data.voteCount;
    div4.appendChild(para2);
    div.appendChild(div4);

    contestantData.prepend(div);
}

if (fileInput) {
    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file == null) {
            error.textContent = 'No file selected!';
            return;
        }
        if (file) {
            error.textContent = ' ';
        }
        const r = /image\/.*/;
        if (!r.test(file.type)) {
            error.textContent = 'plz select image file only';
            return;
        }
        if (r.test(file.type)) {
            error.textContent = ' ';
        }
        //  creating image with custom name
        const extension = file.type.split('/')[1];
        const onlyFileName = file.name.split(`.${extension}`)[0];
        const blob = file.slice(0, -1, file.type);
        const newName = `${onlyFileName}${Date.now()}.${extension}`;
        const newFile = new File([blob], newName, { type: file.type });

        getSignedRequest(newFile);
    });
}

function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

//  if submit exist then add eventlis safe approach when this ele excluded from dom
if (submitbtn) {
    // submitting participant data
    submitbtn.addEventListener('click', () => {
        const name = document.getElementById('name');
        const email = document.getElementById('email');
        const file = fileInput.files[0];
        if (file == null) {
            error.textContent = 'No file selected!';
            return;
        }
        if (name.value.trim() === '' || !validateEmail(email.value.trim())) {
            nameEmailError.textContent = 'Name shouldn\'t be blank or enter valid email';
            return;
        }
        //  photoUrl defined means req is ready to go
        if (photoUrl) {
            fetch('/contests/api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.value,
                    email: email.value,
                    photoUrl,
                    contestid: submitbtn.getAttribute('contestid'),
                }),
            })
                .then(res => res.json())
                .then((data) => {
                    photoUrl = undefined;
                    // console.log('data on cl', data);
                    updateDom(data);
                })
                .catch((err) => {
                    console.log(err);
                });
            name.value = '';
            email.value = '';
            fileInput.value = '';
            document.getElementById('preview').src = '';
        } else {
            console.log('wait a second we r porcessing your request');
        }
    });
}


function eraseErrorMsg() {
    nameEmailError.textContent = '';
}

if (document.getElementById('name')) {
    document.getElementById('name').addEventListener('focus', eraseErrorMsg);
    document.getElementById('email').addEventListener('focus', eraseErrorMsg);
}

//! provide msg during ui improvemnt
function recordVote(event, voterBox, participantid) {
    fetch('/contests/vote/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            participantid,
        }),
    })
        .then(res => res.json())
        .then((data) => {
            // console.log('data from server', data);
            voterBox.push(participantid);
            localStorage.setItem('voterBox', JSON.stringify(voterBox));
            const targetEle = event.target.parentNode.parentNode.children[3].children[0];
            targetEle.textContent = data;
            console.log('Congrats ! You have successfully voted');
        })
        .catch((err) => {
            console.log(err);
        });
}

// recording vote
document.querySelector('body').addEventListener('click', (event) => {
    if (event.target.className === 'votingBtn') {
        const participantid = event.target.getAttribute('participantid');
        //  voterBox exist
        if (localStorage.getItem('voterBox')) {
            const voterBox = JSON.parse(localStorage.getItem('voterBox'));
            //  voterbox does include id
            if (voterBox.includes(participantid)) {
                console.log('you have already voted');
            } else {
                //  voterBox doesn't hv id
                recordVote(event, voterBox, participantid);
            }
        } else {
            //  voterBox not exist
            const voterBox = [];
            recordVote(event, voterBox, participantid);
        }
    }
});
