var dbObject = firebase.database().ref().child('todoList');

dbObject.orderByChild('todo').on('value', function(dataSnapshot) {
    fillTodoList(dataSnapshot);
});

function fillTodoList(dataSnapshot) {
    showItem(loading);
    todoList.innerHTML = '';
    var ul = document.createElement('ul');
    dataSnapshot.forEach(function(item) {
        var value = item.val();
        var li = document.createElement('li');
        var imgLi = document.createElement('img');
        imgLi.height = 26;
        imgLi.width = 26;
        imgLi.src = value.imgUrl;
        li.appendChild(imgLi);

        var pLi = document.createElement('p');
        pLi.appendChild(document.createTextNode(value.todo));
        pLi.id = item.key;
        pLi.setAttribute('class', 'todoItemList');
        li.appendChild(pLi);

        if (canEditTodoList) {
            var liRemoveBtn = document.createElement('button');
            liRemoveBtn.appendChild(document.createTextNode('✖'));
            liRemoveBtn.setAttribute('onclick', `removeTodo(\"${item.key}\")`);
            liRemoveBtn.setAttribute('title', 'Remover esta tarefa');
            liRemoveBtn.setAttribute('class', 'removeBtn');
            li.appendChild(liRemoveBtn);

            var liUpdateBtn = document.createElement('button');
            liUpdateBtn.appendChild(document.createTextNode('✎'));
            liUpdateBtn.setAttribute('onclick', `updateTodo(\"${item.key}\")`);
            liUpdateBtn.setAttribute('title', 'Atualizar usando os dados do formulário');
            liUpdateBtn.setAttribute('class', 'updateBtn');
            li.appendChild(liUpdateBtn);
        }
        ul.appendChild(li);
    });
    todoList.appendChild(ul);
    hideItem(loading);
}

addTodoBtn.onclick = function() {
    addOrUpdateTodo();
}

function addOrUpdateTodo(todoKey) {
    if (todo.value != '') {
        var file = fileBtn.files[0];
        if (file != null) {
            showItem(loading);
            var key = firebase.database().ref().push().key;
            var imgPath = 'files/' + /*new Date().getTime()*/ key + '_' + file.name;
            var storageRef = firebase.storage().ref(imgPath);
            var uploadTask = storageRef.put(file);
            uploadTask.on('state_changed', function(snapshot) {
                var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                showItem(uploaderFeedbackDiv);
                uploaderFeedback.value = progress;
            }, function(error) {
                showError(error, 'Erro no upload do arquivo...');
            }, function() {
                storageRef.getDownloadURL().then(function(downloadURL) {
                    var data = {
                        todo: todo.value,
                        imgPath: imgPath,
                        imgUrl: downloadURL
                    }
                    if (todoKey) {
                        dbObject.child(todoKey).update(data);
                    } else {
                        dbObject.push(data);
                    }
                    todo.value = '';
                    fileBtn.value = '';
                    addUpdateTodoText.innerHTML = 'Adicionar tarefa: ';
                    hideItem(uploaderFeedbackDiv);
                    hideItem(updateTodoBtns);
                    showItem(addTodoBtnDiv);
                });
            });
        } else {
            alert('É preciso selecionar uma imagem para a tarefa!');
        }
    } else {
        alert('O formulário não pode estar vazio para criar a tarefa!');
    }
}

function updateTodo(todoKey) {
    hideItem(addTodoBtnDiv);
    showItem(updateTodoBtns);
    var liSelected = document.getElementById(todoKey);
    todo.value = liSelected.innerHTML;
    addUpdateTodoText.innerHTML = '<strong>Atualizar a tarefa: \"' + liSelected.innerHTML + '\"</strong>';
    updateTodoBtn.onclick = function() {
        addOrUpdateTodo(todoKey);
    }
}

function removeTodo(key) {
    var liSelected = document.getElementById(key);
    var confirmation = confirm('Realmente deseja remover (' + liSelected.innerHTML + ')');
    if (confirmation == true) {
        dbObjectRemove = dbObject.child(key);
        dbObjectRemove.once('value').then(function(snapshot) {
            var storageRef = firebase.storage().ref(snapshot.val().imgPath);
            storageRef.delete().catch(function(error) {
                showError(error, 'Houve um erro ao remover o arquivo da tarefa!');
            });
        });
        dbObject.child(key).remove().catch(function(error) {
            showError(error, 'Houve um erro ao remover a tarefa!');
        });
    }
}

cancelUpdateTodoBtn.onclick = function() {
    addUpdateTodoText.innerHTML = 'Adicionar tarefa: ';
    showItem(addTodoBtnDiv);
    hideItem(loading);
    todo.value = '';
    hideItem(updateTodoBtns);
}