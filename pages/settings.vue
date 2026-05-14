<template>
  <div class="min-h-screen font-mali">

    <!-- ===== HEADER ===== -->
    <header class="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-purple-100 shadow-sm">
      <div class="max-w-3xl mx-auto flex items-center gap-3 px-4 py-3">
        <NuxtLink to="/"
          class="w-9 h-9 rounded-xl bg-purple-100 hover:bg-purple-200 flex items-center justify-center text-lg font-bold text-purple-700 transition-all hover:scale-110 active:scale-95">
          ←
        </NuxtLink>
        <div>
          <h1 class="text-xl font-bold text-purple-700 leading-none">⚙️ ตั้งค่าคำศัพท์</h1>
          <p class="text-xs text-gray-400 mt-0.5">{{ vocabList.length }} คำ · {{ categories.length }} หมวดหมู่</p>
        </div>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 py-5 flex flex-col gap-5 pb-12">

      <!-- ===== EXCEL SECTION ===== -->
      <section class="card">
        <h2 class="section-title">📊 จัดการไฟล์ Excel</h2>
        <p class="text-sm text-gray-500 mb-4">
          ดาวน์โหลด template → กรอกคำศัพท์ → เลือกไฟล์กลับมาโหลด
        </p>
        <div class="flex flex-wrap gap-3">
          <button class="action-btn bg-blue-500 hover:bg-blue-600" @click="downloadTemplate">
            📥 ดาวน์โหลด Template Excel
          </button>
          <button class="action-btn bg-indigo-500 hover:bg-indigo-600" @click="openExcelPicker">
            📂 เลือกไฟล์ Excel จากเครื่อง
          </button>
          <button class="action-btn bg-rose-400 hover:bg-rose-500" @click="confirmClearVocab">
            🗑️ ล้างข้อมูลคำศัพท์
          </button>
          <input ref="excelFallbackInput" type="file" accept=".xlsx,.xls,.csv"
            class="hidden" @change="onExcelFallback" />
        </div>
        <p class="mt-2 text-xs text-gray-400">
          💡 การนำเข้า Excel ใหม่จะ <strong>แทนที่ข้อมูลเดิมทั้งหมด</strong> อัตโนมัติ
        </p>
        <div class="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
          <p class="font-bold mb-1">คอลัมน์ใน Excel (A–E)</p>
          <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <span>📝 <strong>word</strong> — APPLE</span>
            <span>😊 <strong>emoji</strong> — 🍎</span>
            <span>🖼️ <strong>image</strong> — apple.png</span>
            <span>🗂️ <strong>category</strong> — ผลไม้</span>
            <span>🇹🇭 <strong>translation</strong> — แอปเปิ้ล</span>
          </div>
        </div>
      </section>

      <!-- ===== IMAGE FOLDER SECTION ===== -->
      <section class="card">
        <h2 class="section-title">🖼️ โฟลเดอร์รูปภาพ</h2>
        <p class="text-sm text-gray-500 mb-1">
          เลือกโฟลเดอร์ที่เก็บรูปภาพ แอปจะอ่านและเก็บไว้ใน device เพื่อใช้ offline
        </p>
        <div class="flex items-center gap-2 my-3 px-3 py-2 rounded-xl"
          :class="storedImageCount > 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'">
          <span class="text-xl">{{ storedImageCount > 0 ? '✅' : '📂' }}</span>
          <div>
            <p class="text-sm font-bold" :class="storedImageCount > 0 ? 'text-green-700' : 'text-gray-500'">
              {{ storedImageCount > 0 ? `โหลดรูปแล้ว ${storedImageCount} ไฟล์` : 'ยังไม่ได้เลือกโฟลเดอร์รูปภาพ' }}
            </p>
            <p class="text-xs text-gray-400">
              {{ storedImageCount > 0 ? 'รูปภาพพร้อมใช้งาน offline' : 'หากไม่มีรูป แอปจะแสดง Emoji แทน' }}
            </p>
          </div>
        </div>
        <div v-if="imgStore.isLoading.value"
          class="my-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 font-bold">
          ⏳ กำลังโหลด {{ imgStore.loadedCount.value }} ไฟล์...
        </div>
        <div class="flex flex-wrap gap-3">
          <button class="action-btn bg-emerald-500 hover:bg-emerald-600"
            :disabled="imgStore.isLoading.value" @click="openFolderPicker">
            📁 {{ storedImageCount > 0 ? 'เพิ่มรูปจากโฟลเดอร์' : 'เลือกโฟลเดอร์รูปภาพ' }}
          </button>
          <button v-if="storedImageCount > 0"
            class="action-btn bg-violet-500 hover:bg-violet-600"
            :disabled="imgStore.isLoading.value" @click="changeFolder">
            🔄 เปลี่ยนโฟลเดอร์
          </button>
          <button v-if="storedImageCount > 0"
            class="action-btn bg-rose-400 hover:bg-rose-500" @click="confirmClearImages">
            🗑️ ล้างรูปทั้งหมด
          </button>
          <input ref="folderFallbackInput" type="file" accept="image/*"
            multiple class="hidden" @change="onFolderFallback" />
        </div>
        <p v-if="!supportsFilePicker" class="mt-2 text-xs text-orange-600">
          ⚠️ เบราว์เซอร์นี้ไม่รองรับ File System API — ใช้ Chrome หรือ Edge
        </p>
      </section>

      <!-- ===== APP MODE ===== -->
      <section class="card">
        <h2 class="section-title">🎮 โหมดการใช้งาน</h2>
        <div class="flex gap-3">
          <button class="mode-btn"
            :class="localAppMode === 'learn' ? 'bg-purple-500 text-white shadow-md ring-2 ring-purple-300' : 'bg-white/80 text-gray-600 hover:bg-purple-50'"
            @click="changeAppMode('learn')">
            <span class="text-xl">📚</span>
            <div class="text-left">
              <p class="font-bold text-sm leading-none">Learn Mode</p>
              <p class="text-xs opacity-70 mt-0.5">เรียนรู้ไปเรื่อย ๆ มีปุ่มช่วยเหลือ</p>
            </div>
          </button>
          <button class="mode-btn"
            :class="localAppMode === 'test' ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-300' : 'bg-white/80 text-gray-600 hover:bg-amber-50'"
            @click="changeAppMode('test')">
            <span class="text-xl">🏆</span>
            <div class="text-left">
              <p class="font-bold text-sm leading-none">Test Mode</p>
              <p class="text-xs opacity-70 mt-0.5">ทดสอบ นับเวลา ไม่มีเฉลย</p>
            </div>
          </button>
        </div>

        <!-- Duration picker (test only) -->
        <Transition name="slide">
          <div v-if="localAppMode === 'test'" class="mt-4">
            <label class="field-label">⏱ เวลาทดสอบ</label>

            <!-- Preset buttons -->
            <div class="flex flex-wrap gap-2 mt-1 mb-3">
              <button v-for="s in [30, 60, 120, 180, 300]" :key="s"
                class="px-3 py-1.5 rounded-xl text-sm font-bold transition-all active:scale-95"
                :class="localTestDuration === s && !useCustomTime
                  ? 'bg-amber-500 text-white shadow'
                  : 'bg-white/80 text-gray-600 border border-gray-200 hover:bg-amber-50'"
                @click="useCustomTime = false; changeTestDuration(s)">
                {{ s < 60 ? s + 's' : (s / 60) + ' min' }}
              </button>
            </div>

            <!-- Custom time input -->
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-1 flex-1 bg-white/80 border-2 rounded-xl px-3 py-1.5 transition-all"
                :class="useCustomTime ? 'border-amber-400 bg-amber-50' : 'border-gray-200'">
                <span class="text-sm text-gray-500 shrink-0">⌨️ กำหนดเอง</span>
                <input
                  v-model.number="customMinutes"
                  type="number" min="1" max="60" placeholder="0"
                  class="w-14 text-center font-bold text-lg bg-transparent outline-none text-amber-600"
                  @focus="useCustomTime = true"
                  @input="onCustomInput"
                />
                <span class="text-sm text-gray-500 shrink-0">นาที</span>
                <input
                  v-model.number="customSeconds"
                  type="number" min="0" max="59" placeholder="00"
                  class="w-14 text-center font-bold text-lg bg-transparent outline-none text-amber-600"
                  @focus="useCustomTime = true"
                  @input="onCustomInput"
                />
                <span class="text-sm text-gray-500 shrink-0">วินาที</span>
              </div>
            </div>

            <p class="text-xs mt-2 font-semibold"
              :class="useCustomTime ? 'text-amber-600' : 'text-gray-400'">
              {{ useCustomTime ? '✅ ใช้เวลา ' + formatDuration(localTestDuration) : 'หรือกรอกเวลาที่ต้องการด้านบน' }}
            </p>
            <p class="text-xs text-gray-400">
              เลือกหมวดหมู่ด้านล่าง — ระบบจะสุ่มคำทั้งหมดในหมวดที่เลือก
            </p>
          </div>
        </Transition>
      </section>

      <!-- ===== TOPIC & PLAY MODE (learn only) ===== -->
      <section v-if="localAppMode === 'learn'" class="card">
        <h2 class="section-title">🏷️ หัวข้อบทเรียน &amp; โหมดการเล่น</h2>

        <!-- Topic input -->
        <label class="field-label">ข้อความหัวข้อที่แสดงบนภาพ</label>
        <input
          v-model="topicInput"
          class="field-input"
          placeholder="เช่น หมวดผลไม้  หรือ  บทที่ 1  (ว่างไว้ = แสดงชื่อหมวดอัตโนมัติ)"
          @input="setTopic(topicInput)"
        />
        <p class="text-xs text-gray-400 mt-1.5 mb-4">
          ตัวอย่างที่จะแสดงในเกม:
          <span class="font-bold text-purple-600">{{ topicInput || currentCategoryPreview }}</span>
        </p>

        <!-- Play mode -->
        <label class="field-label">โหมดการดึงคำถาม</label>
        <div class="flex gap-3">
          <button
            class="mode-btn"
            :class="localPlayMode === 'sequence' ? 'bg-purple-500 text-white shadow-md ring-2 ring-purple-300' : 'bg-white/80 text-gray-600 hover:bg-purple-50'"
            @click="changePlayMode('sequence')"
          >
            <span class="text-xl">📋</span>
            <div class="text-left">
              <p class="font-bold text-sm leading-none">เรียงลำดับ</p>
              <p class="text-xs opacity-70 mt-0.5">ทำทีละคำ ตามลำดับในรายการ</p>
            </div>
          </button>
          <button
            class="mode-btn"
            :class="localPlayMode === 'random' ? 'bg-purple-500 text-white shadow-md ring-2 ring-purple-300' : 'bg-white/80 text-gray-600 hover:bg-purple-50'"
            @click="changePlayMode('random')"
          >
            <span class="text-xl">🎲</span>
            <div class="text-left">
              <p class="font-bold text-sm leading-none">สุ่มคำถาม</p>
              <p class="text-xs opacity-70 mt-0.5">สุ่มคำใหม่ทุกครั้งที่กด ถัดไป</p>
            </div>
          </button>
        </div>

        <!-- Case mode -->
        <label class="field-label mt-4">รูปแบบตัวอักษร</label>
        <div class="flex gap-3">
          <button class="mode-btn"
            :class="localCaseMode === 'upper' ? 'bg-purple-500 text-white shadow-md ring-2 ring-purple-300' : 'bg-white/80 text-gray-600 hover:bg-purple-50'"
            @click="changeCaseMode('upper')"
          >
            <span class="text-xl font-black tracking-tight">ABC</span>
            <div class="text-left">
              <p class="font-bold text-sm leading-none">ตัวพิมพ์ใหญ่</p>
              <p class="text-xs opacity-70 mt-0.5">A B C D E ...</p>
            </div>
          </button>
          <button class="mode-btn"
            :class="localCaseMode === 'lower' ? 'bg-purple-500 text-white shadow-md ring-2 ring-purple-300' : 'bg-white/80 text-gray-600 hover:bg-purple-50'"
            @click="changeCaseMode('lower')"
          >
            <span class="text-xl font-black tracking-tight">abc</span>
            <div class="text-left">
              <p class="font-bold text-sm leading-none">ตัวพิมพ์เล็ก</p>
              <p class="text-xs opacity-70 mt-0.5">a b c d e ...</p>
            </div>
          </button>
        </div>
      </section>

      <!-- ===== CATEGORY FILTER ===== -->
      <section class="card">
        <div class="flex items-center justify-between mb-3">
          <h2 class="section-title mb-0">🗂️ เลือกหมวดหมู่สำหรับเล่น</h2>
          <div class="flex gap-2">
            <button
              class="text-xs font-bold text-purple-500 hover:text-purple-700 transition-colors px-2 py-1 rounded-lg hover:bg-purple-50"
              @click="selectAllCategories"
            >☑ เลือกทั้งหมด</button>
            <button
              class="text-xs font-bold text-rose-400 hover:text-rose-600 transition-colors px-2 py-1 rounded-lg hover:bg-rose-50"
              @click="deselectAllCategories"
            >☐ ยกเลิกทั้งหมด</button>
          </div>
        </div>

        <!-- Category checkboxes -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label
            v-for="cat in categories"
            :key="cat"
            class="cat-check-row"
            :class="isCatActive(cat) ? 'border-purple-300 bg-purple-50' : 'border-gray-200 bg-white/60'"
          >
            <input
              type="checkbox"
              class="w-5 h-5 rounded accent-purple-500 cursor-pointer shrink-0"
              :checked="isCatActive(cat)"
              @change="toggleCategory(cat)"
            />
            <span class="flex-1 font-semibold text-gray-700">{{ cat }}</span>
            <span
              class="text-xs font-bold px-2 py-0.5 rounded-full"
              :class="isCatActive(cat) ? 'bg-purple-200 text-purple-700' : 'bg-gray-100 text-gray-400'"
            >{{ catCount[cat] ?? 0 }} คำ</span>
          </label>
        </div>

        <!-- Active summary bar -->
        <div class="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl"
          :class="activeWordCount > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border-2 border-red-300'">
          <span class="text-base shrink-0">{{ activeWordCount > 0 ? '✅' : '⚠️' }}</span>
          <div>
            <p class="text-sm font-bold" :class="activeWordCount > 0 ? 'text-green-700' : 'text-red-600'">
              {{ activeWordCount > 0 ? 'คำที่จะใช้เล่น:' : 'ยังไม่ได้เลือกหมวดหมู่!' }}
              <span v-if="activeWordCount > 0" class="text-lg">{{ activeWordCount }}</span>
              <span v-if="activeWordCount > 0" class="font-normal text-gray-400"> คำ (จากทั้งหมด {{ vocabList.length }} คำ)</span>
            </p>
            <p v-if="activeWordCount === 0" class="text-xs text-red-400 mt-0.5">กรุณาเลือกอย่างน้อย 1 หมวดหมู่ก่อนกลับไปเล่น</p>
          </div>
        </div>
      </section>

      <!-- ===== VOCAB MANAGEMENT ===== -->
      <section class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="section-title mb-0">📚 รายการคำศัพท์</h2>
          <div class="flex gap-2">
            <button class="action-btn bg-emerald-500 hover:bg-emerald-600 py-1.5 px-3 text-sm" @click="openAddModal">
              ➕ เพิ่มคำ
            </button>
            <button class="action-btn bg-rose-400 hover:bg-rose-500 py-1.5 px-3 text-sm" @click="confirmReset">
              🔄 รีเซ็ต
            </button>
          </div>
        </div>

        <!-- Category filter -->
        <div class="flex flex-wrap gap-2 mb-3">
          <button class="cat-chip"
            :class="activeCategory === '' ? 'bg-purple-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-purple-100'"
            @click="activeCategory = ''">
            ทั้งหมด ({{ vocabList.length }})
          </button>
          <button v-for="cat in categories" :key="cat" class="cat-chip"
            :class="activeCategory === cat ? 'bg-purple-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-purple-100'"
            @click="activeCategory = cat">
            {{ cat }} ({{ vocabList.filter(i => i.category === cat).length }})
          </button>
        </div>

        <!-- Table -->
        <div class="overflow-hidden rounded-xl border border-purple-100">
          <table class="w-full text-sm">
            <thead class="bg-purple-50 border-b border-purple-100">
              <tr>
                <th class="px-3 py-2 text-left text-purple-700 font-bold">#</th>
                <th class="px-3 py-2 text-left text-purple-700 font-bold">คำศัพท์</th>
                <th class="px-3 py-2 text-left text-purple-700 font-bold">Emoji</th>
                <th class="px-3 py-2 text-left text-purple-700 font-bold">คำแปล</th>
                <th class="px-3 py-2 text-left text-purple-700 font-bold hidden md:table-cell">หมวดหมู่</th>
                <th class="px-3 py-2 text-center text-purple-700 font-bold">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in filteredList" :key="item.id"
                class="border-b border-gray-100 hover:bg-purple-50/50 transition-colors">
                <td class="px-3 py-2 text-gray-400 text-xs">{{ idx + 1 }}</td>
                <td class="px-3 py-2 font-bold text-gray-800 tracking-widest">{{ item.word }}</td>
                <td class="px-3 py-2 text-xl">{{ item.emoji || '—' }}</td>
                <td class="px-3 py-2 text-gray-700 text-sm font-semibold">{{ item.translation || '—' }}</td>
                <td class="px-3 py-2 hidden md:table-cell">
                  <span class="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {{ item.category }}
                  </span>
                </td>
                <td class="px-3 py-2 text-center">
                  <button class="icon-btn text-blue-500 hover:text-blue-700" @click="openEditModal(item)">✏️</button>
                  <button class="icon-btn text-red-400 hover:text-red-600 ml-1" @click="confirmDelete(item)">🗑️</button>
                </td>
              </tr>
              <tr v-if="filteredList.length === 0">
                <td colspan="6" class="px-4 py-8 text-center text-gray-400">ไม่มีคำศัพท์ในหมวดนี้</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    </main>

    <!-- Copyright footer -->
    <footer class="text-center py-3">
      <p class="text-[10px] text-gray-400 tracking-wide">
        ✦ © 2026 Winai Nunkratok · Educational Supervisor · All rights reserved ✦
      </p>
    </footer>

    <!-- ===== ADD / EDIT MODAL ===== -->
    <Transition name="modal">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showModal = false"></div>
        <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 font-mali">
          <h2 class="text-xl font-bold text-purple-700 mb-4">
            {{ editingId ? '✏️ แก้ไขคำศัพท์' : '➕ เพิ่มคำศัพท์ใหม่' }}
          </h2>
          <form @submit.prevent="saveItem" class="flex flex-col gap-4">
            <div>
              <label class="field-label">คำศัพท์ <span class="text-red-500">*</span></label>
              <input v-model="form.word" class="field-input" placeholder="เช่น APPLE"
                @input="form.word = (form.word as string).toUpperCase().replace(/[^A-Z]/g,'')" required />
            </div>
            <div>
              <label class="field-label">อิโมจิ</label>
              <div class="flex gap-3 items-center">
                <input v-model="form.emoji" class="field-input flex-1" placeholder="วางอิโมจิที่นี่ เช่น 🍎" />
                <div class="w-14 h-14 rounded-xl bg-purple-50 border-2 border-purple-200 flex items-center justify-center text-3xl shrink-0">
                  {{ form.emoji || '❓' }}
                </div>
              </div>
            </div>
            <div>
              <label class="field-label">ชื่อไฟล์รูปภาพ</label>
              <input v-model="form.image" class="field-input" placeholder="เช่น apple.png" />
            </div>
            <div>
              <label class="field-label">คำแปลภาษาไทย</label>
              <input v-model="form.translation" class="field-input" placeholder="เช่น แอปเปิ้ล" />
            </div>
            <div>
              <label class="field-label">หมวดหมู่ <span class="text-red-500">*</span></label>
              <input v-model="form.category" class="field-input" placeholder="เช่น ผลไม้"
                list="cat-list" required />
              <datalist id="cat-list">
                <option v-for="c in categories" :key="c" :value="c"></option>
              </datalist>
            </div>
            <div class="flex gap-3 pt-1">
              <button type="submit"
                class="flex-1 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold transition-all active:scale-95">
                💾 บันทึก
              </button>
              <button type="button"
                class="flex-1 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold transition-all active:scale-95"
                @click="showModal = false">
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- ===== CONFIRM DIALOG ===== -->
    <Transition name="modal">
      <div v-if="confirmMsg" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="confirmMsg = ''"></div>
        <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 font-mali text-center">
          <p class="text-4xl mb-3">⚠️</p>
          <p class="font-bold text-gray-800 mb-5">{{ confirmMsg }}</p>
          <div class="flex gap-3">
            <button class="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-all active:scale-95"
              @click="runConfirm">ยืนยัน</button>
            <button class="flex-1 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold transition-all active:scale-95"
              @click="confirmMsg = ''">ยกเลิก</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ===== TOAST ===== -->
    <Transition name="toast">
      <div v-if="toast"
        class="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-xl whitespace-nowrap">
        {{ toast }}
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useVocab, type VocabItem } from '~/composables/useVocab'
import { useImageStore, storedImageCount, syncCount } from '~/composables/useImageStore'

// ── Vocab ─────────────────────────────────────────────────────────────────────
const {
  vocabList, filteredVocabList, categories, categoryCounts,
  topic, playMode, caseMode, appMode, testDuration, init,
  setTopic, setPlayMode, setCaseMode, setAppMode, setTestDuration,
  isCatActive, toggleCategory, selectAllCategories, deselectAllCategories,
  add, update, remove, reset, replaceAll,
} = useVocab()

const activeWordCount  = computed(() => filteredVocabList.value.length)
const catCount         = computed(() => categoryCounts.value)
onMounted(async () => { init(); await syncCount() })

// ── Local mirrors for reactive toggles ────────────────────────────────────────
const topicInput        = ref('')
const localPlayMode     = ref<'random' | 'sequence'>('sequence')
const localCaseMode     = ref<'upper' | 'lower'>('upper')
const localAppMode      = ref<'learn' | 'test'>('learn')
const localTestDuration = ref(60)
const currentCategoryPreview = computed(() => vocabList.value[0]?.category ?? 'ผลไม้')

onMounted(() => {
  topicInput.value        = topic.value
  localPlayMode.value     = playMode.value
  localCaseMode.value     = caseMode.value
  localAppMode.value      = appMode.value
  localTestDuration.value = testDuration.value
})

function changePlayMode(m: 'random' | 'sequence')  { localPlayMode.value = m;     setPlayMode(m) }
function changeCaseMode(m: 'upper' | 'lower')       { localCaseMode.value = m;     setCaseMode(m) }
function changeAppMode(m: 'learn' | 'test')         { localAppMode.value = m;      setAppMode(m) }
function changeTestDuration(s: number)              { localTestDuration.value = s; setTestDuration(s) }

// ── Custom time input ─────────────────────────────────────────────────────────
const useCustomTime  = ref(false)
const customMinutes  = ref(0)
const customSeconds  = ref(0)

// Initialise custom fields from saved duration
onMounted(() => {
  const presets = [30, 60, 120, 180, 300]
  if (!presets.includes(localTestDuration.value)) {
    useCustomTime.value  = true
    customMinutes.value  = Math.floor(localTestDuration.value / 60)
    customSeconds.value  = localTestDuration.value % 60
  }
})

function onCustomInput() {
  const total = Math.max(5, (customMinutes.value || 0) * 60 + (customSeconds.value || 0))
  changeTestDuration(total)
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? (m + ' นาที ' + (sec > 0 ? sec + ' วินาที' : '')) : sec + ' วินาที'
}

const imgStore = useImageStore()
const { storeFiles } = imgStore

// ── Browser capability detection ──────────────────────────────────────────────
const supportsFilePicker = ref(false)
onMounted(() => { supportsFilePicker.value = 'showOpenFilePicker' in window })

// ── Fallback input refs ───────────────────────────────────────────────────────
const excelFallbackInput = ref<HTMLInputElement | null>(null)
const folderFallbackInput = ref<HTMLInputElement | null>(null)

// ── Category filter ───────────────────────────────────────────────────────────
const activeCategory = ref('')
const filteredList = computed(() =>
  activeCategory.value ? vocabList.value.filter(i => i.category === activeCategory.value) : vocabList.value
)

// ── Excel ─────────────────────────────────────────────────────────────────────
async function openExcelPicker() {
  const file = await imgStore.pickExcelFile()
  if (file) { await processExcelFile(file); return }
  // Null means: browser doesn't support File System Access API → use fallback input
  excelFallbackInput.value?.click()
}

async function onExcelFallback(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  await processExcelFile(file)
  ;(e.target as HTMLInputElement).value = ''
}

async function processExcelFile(file: File) {
  try {
    const XLSX = await import('xlsx')
    const buf  = await file.arrayBuffer()
    const wb   = XLSX.read(buf)
    const sheetName = wb.SheetNames.includes('คำศัพท์') ? 'คำศัพท์' : wb.SheetNames[0]
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets[sheetName])
    const items = rows
      .map(r => ({
        word:        String(r.word        ?? r['คำศัพท์'] ?? '').toUpperCase().replace(/[^A-Z]/g, ''),
        emoji:       String(r.emoji       ?? r['อิโมจิ']   ?? '').trim(),
        image:       String(r.image       ?? r['รูปภาพ']   ?? '').trim(),
        category:    String(r.category    ?? r['หมวดหมู่'] ?? '').trim(),
        translation: String(r.translation ?? r['คำแปล']   ?? '').trim(),
      }))
      .filter(r => r.word.length >= 2 && r.category)
    if (!items.length) { showToast('❌ ไม่พบข้อมูลที่ถูกต้อง'); return }
    replaceAll(items)
    showToast(`✅ โหลด ${items.length} คำเรียบร้อย`)
  } catch {
    showToast('❌ เกิดข้อผิดพลาดในการอ่านไฟล์')
  }
}

// ── Image folder ──────────────────────────────────────────────────────────────
async function openFolderPicker() {
  const count = await imgStore.pickFolder()
  if (count === -1) {
    // Browser doesn't support directory picker → use multi-file input fallback
    folderFallbackInput.value?.click()
    return
  }
  if (count === 0) return
  showToast(`✅ โหลดรูปภาพ ${count} ไฟล์เรียบร้อย`)
}

async function onFolderFallback(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  if (!files.length) return
  const stored = await storeFiles(files)
  showToast(`✅ โหลดรูปภาพ ${stored} ไฟล์เรียบร้อย`)
  ;(e.target as HTMLInputElement).value = ''
}

// ── Excel template download ───────────────────────────────────────────────────
async function downloadTemplate() {
  const XLSX = await import('xlsx')
  const instructions = [
    ['📌 Winai WordDrop — Excel Template'],
    [''],
    ['คอลัมน์',    'คำอธิบาย',                           'ตัวอย่าง'],
    ['word',       'คำศัพท์ภาษาอังกฤษ ตัวพิมพ์ใหญ่ A-Z', 'APPLE'],
    ['emoji',      'อิโมจิ 1 ตัว (แทนรูปภาพได้)',         '🍎'],
    ['image',      'ชื่อไฟล์รูป (ใส่ไว้ในโฟลเดอร์รูป)',  'apple.png'],
    ['category',   'หมวดหมู่',                             'ผลไม้'],
    ['translation','คำแปลภาษาไทย',                        'แอปเปิ้ล'],
    [''],
    ['💡 หากไม่มีรูปภาพ ใส่แค่ emoji ก็ได้'],
    ['💡 translation ว่างได้ — จะไม่แสดงคำแปลเมื่อตอบถูก'],
  ]
  const data = [
    ['word', 'emoji', 'image', 'category', 'translation'],
    ...vocabList.value.map(i => [i.word, i.emoji ?? '', i.image, i.category, i.translation ?? '']),
  ]
  const wb    = XLSX.utils.book_new()
  const wsI   = XLSX.utils.aoa_to_sheet(instructions)
  wsI['!cols'] = [{ wch: 12 }, { wch: 40 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsI, 'คำแนะนำ')
  const wsD   = XLSX.utils.aoa_to_sheet(data)
  wsD['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 22 }, { wch: 16 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, wsD, 'คำศัพท์')
  XLSX.writeFile(wb, 'winai-worddrop-vocab.xlsx')
  showToast('📥 ดาวน์โหลดสำเร็จ')
}

// ── Form / CRUD ───────────────────────────────────────────────────────────────
const showModal = ref(false)
const editingId = ref<number | null>(null)
const form = ref({ word: '', emoji: '', image: '', category: '', translation: '' })

function openAddModal() {
  editingId.value = null
  form.value = { word: '', emoji: '', image: '', category: categories.value[0] ?? '', translation: '' }
  showModal.value = true
}
function openEditModal(item: VocabItem) {
  editingId.value = item.id
  form.value = { word: item.word, emoji: item.emoji ?? '', image: item.image, category: item.category, translation: item.translation ?? '' }
  showModal.value = true
}
function saveItem() {
  const p = {
    word: form.value.word.trim(),
    emoji: form.value.emoji.trim(),
    image: form.value.image.trim(),
    category: form.value.category.trim(),
    translation: form.value.translation.trim(),
  }
  if (!p.word || !p.category) return
  editingId.value !== null ? update(editingId.value, p) : add(p)
  showModal.value = false
  showToast(editingId.value ? '✅ แก้ไขแล้ว' : '✅ เพิ่มคำใหม่แล้ว')
}

// ── Confirm ───────────────────────────────────────────────────────────────────
const confirmMsg = ref('')
let _pending: (() => void) | null = null

function confirmDelete(item: VocabItem) {
  confirmMsg.value = `ลบคำว่า "${item.word}" ?`
  _pending = () => { remove(item.id); showToast('🗑️ ลบแล้ว') }
}
function confirmReset() {
  confirmMsg.value = 'รีเซ็ตคำศัพท์ทั้งหมดกลับเป็นค่าเริ่มต้น?'
  _pending = () => { reset(); showToast('🔄 รีเซ็ตเรียบร้อย') }
}
function confirmClearImages() {
  confirmMsg.value = 'ล้างรูปภาพที่บันทึกไว้ทั้งหมด?'
  _pending = async () => { await imgStore.clearAll(); showToast('🗑️ ล้างรูปแล้ว') }
}

function confirmClearVocab() {
  confirmMsg.value = 'ล้างข้อมูลคำศัพท์ทั้งหมด?'
  _pending = () => {
    replaceAll([])
    selectAllCategories()          // reset category filter ด้วย ไม่ให้ค้าง
    showToast('🗑️ ล้างแล้ว — นำเข้า Excel ใหม่ได้เลย')
  }
}

async function changeFolder() {
  // Clear existing images then open folder picker in one step
  await imgStore.clearAll()
  showToast('🗑️ ล้างรูปเดิมแล้ว กำลังเปิดโฟลเดอร์...')
  await openFolderPicker()
}
function runConfirm() { _pending?.(); _pending = null; confirmMsg.value = '' }

// ── Toast ─────────────────────────────────────────────────────────────────────
const toast = ref('')
let _tt: ReturnType<typeof setTimeout> | null = null
function showToast(msg: string) {
  toast.value = msg
  if (_tt) clearTimeout(_tt)
  _tt = setTimeout(() => { toast.value = '' }, 2400)
}
</script>

<style scoped>
.card         { @apply bg-white/80 backdrop-blur-sm rounded-2xl shadow border border-purple-100 p-4 }
.section-title{ @apply text-base font-bold text-purple-700 mb-3 }
.action-btn   { @apply px-4 py-2 rounded-xl font-bold text-white text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed }
.cat-chip     { @apply px-3 py-1 rounded-full text-sm font-semibold transition-all cursor-pointer }
.icon-btn     { @apply text-lg transition-transform hover:scale-125 active:scale-95 }
.field-label  { @apply block text-sm font-bold text-gray-600 mb-1 }
.field-input  { @apply w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-purple-400 focus:bg-white transition-colors font-mali text-base }

.mode-btn      { @apply flex items-center gap-3 flex-1 px-4 py-3 rounded-xl border-2 border-transparent transition-all active:scale-95 cursor-pointer }
.cat-check-row { @apply flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all cursor-pointer hover:border-purple-300 }

.modal-enter-active,.modal-leave-active { transition: all .25s ease }
.modal-enter-from,.modal-leave-to       { opacity: 0; transform: scale(.95) }
.toast-enter-active,.toast-leave-active { transition: all .3s ease }
.toast-enter-from,.toast-leave-to       { opacity: 0; transform: translateX(-50%) translateY(-12px) }
</style>
