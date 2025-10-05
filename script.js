// script.js

document.addEventListener('DOMContentLoaded', () => {
    // Ambil elemen-elemen dari HTML
    const taskInput = document.getElementById('task-input');
    const dueDateInput = document.getElementById('due-date-input');
    const addButton = document.getElementById('add-button');
    const taskList = document.getElementById('task-list');
    const filterSelect = document.getElementById('filter-select');
    const emptyState = document.getElementById('empty-state');
    
    // Inisialisasi daftar tugas dari Local Storage atau array kosong
    let tasks = JSON.parse(localStorage.getItem('todoTasks')) || [];

    // --- Event Listeners ---
    addButton.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    filterSelect.addEventListener('change', renderTasks);
    
    // Muat tugas saat halaman pertama kali dimuat
    renderTasks();

    // --- FUNGSI LOCAL STORAGE ---

    function saveTasks() {
        // Simpan array tasks ke Local Storage setelah diubah jadi JSON string
        localStorage.setItem('todoTasks', JSON.stringify(tasks));
    }

    // --- FUNGSI UTAMA RENDERING (Menampilkan Tugas) ---

    function renderTasks() {
        taskList.innerHTML = ''; // Kosongkan daftar sebelum diisi ulang
        
        const filter = filterSelect.value;
        
        // Terapkan Filter
        const filteredTasks = tasks.filter(task => {
            if (filter === 'pending') return !task.completed;
            if (filter === 'completed') return task.completed;
            return true; // Filter 'all'
        });
        
        // Tampilkan Empty State jika tidak ada tugas setelah difilter
        emptyState.style.display = (filteredTasks.length === 0 && filter === 'all') ? 'block' : 'none';
        
        filteredTasks.forEach(task => {
            const listItem = createTaskElement(task);
            taskList.appendChild(listItem);
        });
        
        // Simpan perubahan urutan ke Local Storage setelah rendering
        saveTasks();
    }

    // --- FUNGSI MEMBUAT ELEMEN TUGAS BARU ---

    function createTaskElement(task) {
        const listItem = document.createElement('li');
        listItem.setAttribute('draggable', true); // Aktifkan Drag and Drop
        listItem.classList.add('task-item');
        if (task.completed) {
            listItem.classList.add('completed');
        }
        
        // Cek status tenggat (Urgent)
        const today = new Date().setHours(0, 0, 0, 0);
        const dueDate = task.dueDate ? new Date(task.dueDate).setHours(0, 0, 0, 0) : null;
        
        if (dueDate && dueDate < today && !task.completed) {
            listItem.classList.add('urgent'); // Tugas sudah lewat tenggat
        } else if (dueDate && dueDate === today && !task.completed) {
            listItem.classList.add('urgent'); // Tugas tenggat hari ini
        }

        // Konten Tugas
        const taskDetails = document.createElement('div');
        taskDetails.classList.add('task-details');
        
        const taskTextSpan = document.createElement('span');
        taskTextSpan.classList.add('task-text');
        taskTextSpan.textContent = task.text;
        
        const dateSpan = document.createElement('span');
        dateSpan.classList.add('due-date');
        const formattedDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Tidak Ada';
        dateSpan.textContent = `Tenggat: ${formattedDate}`;

        taskDetails.appendChild(taskTextSpan);
        taskDetails.appendChild(dateSpan);
        
        // Tombol Aksi (Edit & Hapus)
        const actionButtons = document.createElement('div');
        actionButtons.classList.add('action-buttons');
        
        const editButton = document.createElement('button');
        editButton.classList.add('edit-button');
        editButton.innerHTML = '<i class="fas fa-edit"></i>';

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-button');
        deleteButton.innerHTML = '<i class="fas fa-trash"></i>';

        actionButtons.appendChild(editButton);
        actionButtons.appendChild(deleteButton);
        
        // Gabungkan semua ke LI
        listItem.appendChild(taskDetails);
        listItem.appendChild(actionButtons);
        
        // --- Event Listeners untuk Setiap Tugas ---
        
        // 1. Tandai Selesai (Toggle Completed)
        taskTextSpan.addEventListener('click', () => {
            task.completed = !task.completed;
            renderTasks(); // Render ulang untuk menerapkan status baru
        });

        // 2. Edit Tugas
        editButton.addEventListener('click', () => {
            const newText = prompt("Edit tugas:", task.text);
            if (newText !== null && newText.trim() !== "") {
                task.text = newText.trim();
                renderTasks();
            }
        });
        
        // 3. Hapus Tugas
        deleteButton.addEventListener('click', () => {
            // Animasi fade-out sebelum dihapus (UX)
            listItem.style.opacity = 0;
            setTimeout(() => {
                tasks = tasks.filter(t => t !== task); // Hapus dari array tasks
                renderTasks(); // Render ulang daftar
            }, 300); // Tunggu 300ms untuk animasi selesai
        });
        
        // 4. Drag and Drop Listeners
        addDragAndDropListeners(listItem, task);

        return listItem;
    }

    // --- FUNGSI TAMBAH TUGAS BARU ---

    function addTask() {
        const text = taskInput.value.trim();
        const dueDate = dueDateInput.value;

        if (text === "") {
            alert("Tugas tidak boleh kosong!");
            return;
        }

        const newTask = {
            text,
            dueDate,
            completed: false
        };

        tasks.push(newTask);

        // Bersihkan input
        taskInput.value = '';
        dueDateInput.value = '';

        renderTasks(); // Render ulang daftar
    }

    // --- FUNGSI DRAG AND DROP ---
    
    let draggedItem = null;

    function addDragAndDropListeners(item, task) {
        item.addEventListener('dragstart', () => {
            draggedItem = item;
            // Simpan data task yang sedang di-drag untuk referensi
            draggedItem.dataset.id = task.text; 
            setTimeout(() => item.classList.add('dragging'), 0);
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            draggedItem = null;
        });

        taskList.addEventListener('dragover', (e) => {
            e.preventDefault(); // Izinkan drop
            if (draggedItem) {
                const afterElement = getDragAfterElement(taskList, e.clientY);
                const currentTask = draggedItem;
                if (afterElement == null) {
                    taskList.appendChild(currentTask);
                } else {
                    taskList.insertBefore(currentTask, afterElement);
                }
            }
        });

        taskList.addEventListener('drop', (e) => {
            e.preventDefault();
            
            // Perbarui array tasks sesuai urutan DOM yang baru
            const newOrder = Array.from(taskList.querySelectorAll('.task-item')).map(el => {
                const text = el.querySelector('.task-text').textContent;
                // Cari task yang sesuai di array tasks asli
                return tasks.find(t => t.text === text);
            });
            
            // Ganti array tasks dengan urutan baru
            tasks = newOrder.filter(t => t); 
            saveTasks(); // Simpan urutan baru
            // Opsional: renderTasks(); jika ada masalah dengan filter setelah drop
        });
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    // Panggil renderTasks untuk pertama kali
    renderTasks();
});