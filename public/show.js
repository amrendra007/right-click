const submitbtn = document.getElementById('submitbtn');
const fileInput = document.getElementById('file-input');
const error = document.getElementById('error');
const nameEmailError = document.getElementById('nameEmailError');

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
    const button = document.createElement('input');
    button.type = 'button';
    button.value = 'vote';
    button.className = 'votingBtn';
    button.participantid = data._id; //eslint-disable-line
    div3.appendChild(button);
    div.appendChild(div3);

    const div4 = document.createElement('div');
    const para2 = document.createElement('p');
    para2.textContent = `Hits: ${data.voteCount}`;
    div4.appendChild(para2);
    div.appendChild(div4);

    contestantData.prepend(div);
}

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

function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

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
    if (photoUrl) {
        fetch('/contests/api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name.value,
                email: email.value,
                photoUrl,
            }),
        })
            .then(res => res.json())
            .then((data) => {
                photoUrl = undefined;
                console.log(data);
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

function eraseErrorMsg() {
    nameEmailError.textContent = '';
}

document.getElementById('name').addEventListener('focus', eraseErrorMsg);
document.getElementById('email').addEventListener('focus', eraseErrorMsg);

//! provide msg during ui improvemnt
function recordVote(voterBox, participantid) {
    fetch('/contests/vote/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            participantid,
        }),
    })
        .then((res) => {
            voterBox.push(participantid);
            localStorage.setItem('voterBox', JSON.stringify(voterBox));
            console.log('Congrats ! You have successfully voted');
        })
        .catch((err) => {
            console.log(err);
        });
}

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
                recordVote(voterBox, participantid);
            }
        } else {
            //  voterBox not exist
            const voterBox = [];
            recordVote(voterBox, participantid);
        }
    }
});
