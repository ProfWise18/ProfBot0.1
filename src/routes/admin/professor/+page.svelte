<script>
	import Modal from '../components/Modal.svelte'
	import { goto, invalidate } from '$app/navigation'
	import { loading as load } from '$lib/store'
	import { showMessage } from '$lib/util'

	export let data
	let { professors, tests } = data

	let professorSessionUsed = []
	let newProfs = [];
	for (const prof of professors) {
		const usedTests = prof.Test.reduce((acc, t) => {
			const usedTest = tests
				.filter((test) => test.shareLink === t.shareLink)
				.map((e) => ({ ...e, profId: prof.id }))
			return [...acc, ...usedTest]
		}, [])
		professorSessionUsed = [...professorSessionUsed, ...usedTests]
	}

	let currentProfessorIndex = 0
	let isModalOpen = false
	let loading = false
	let currentProfessor = {
		name: '',
		email: '',
		role:"PROF",
	}
	let currentProfessorModal = false

	const handleProfessor = async (e) => {
		e.preventDefault()
		loading = true
		const form = new FormData(e.target)

		try {
			const req = await fetch('/api/professor', {
				method: 'POST',
				body: form
			})
			loading = false;
				isModalOpen = false
			const res = await req.json()

			if (res.status == 200) {
				

				professors.push(res.prof)
				professors = professors

				showMessage({
					type:"success",
					_message:res.message
				})
				load.set(false)

				e.target.reset()
			} else if (res.status == 500) {
				showMessage({
					type: 'Error',
					_message: res.message
				})
				load.set(false)
				isModalOpen = false
				return false
			}

			showMessage({
				type: 'success',
				_message: 'Created Professor Succesfully!'
			})

			loading = false
		} catch (e) {
			console.log(e)
		}
	}

	const deleteProf = async (id) => {
		if (!confirm('Are you sure you want to delete this professor')) {
			return false
		}

		load.set(true)
		let req = await fetch('/api/professor', {
			method: 'DELETE',
			body: JSON.stringify({ id: id })
		})
		let res = await req.json()
		if (res.status == 200) {
			showMessage({
				type: 'Success',
				_message: 'Deleted Professor succesfull!'
			})
		}
		professors = professors.filter((item) => item.id !== id)
		professors = professors

		load.set(false)
	}

	const updateProf = async (e) => {
		e.preventDefault()
		load.set(true)
		try {
			let req = await fetch('/api/professor', {
				method: 'PATCH',
				body: JSON.stringify(currentProfessor)
			})
			let res = await req.json()
			professors[currentProfessorIndex].name = currentProfessor.name
			professors[currentProfessorIndex].role = currentProfessor.role
			professors = professors
			if (res.status == 200) {
				showMessage({
					type: 'success',
					_message: 'Updated professor succesfully!'
				})
			}
		} catch (e) {
			console.log(e)
		}
		load.set(false)
		currentProfessorModal = false
	}

	const setCurrentProfessor = (data, index) => {
		currentProfessorModal = true
		currentProfessor.email = data.email
		currentProfessor.name = data.name
		currentProfessor.role = data.role
		currentProfessorIndex = index
	}
</script>

<div class="container">
	<div class="flex justify-between">
		<h1 class="text-2xl">Professors</h1>
		<button class="btn-p" on:click={() => (isModalOpen = true)}>Add Professor</button>
	</div>
	<div class="overflow-x-auto mt-4">
		<table class="table w-full">
			<!-- head -->
			<thead>
				<tr>
					<th>id</th>
					<th>Email</th>
					<th>Tests Created</th>
					<th>Sessions Used</th>
					<th>Role</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each professors as professor, i}
					<tr>
						<th>{professor.id}</th>
						<td>{professor.email}</td>
						<td>{professor?.Test?.length || 0}</td>
						<td>{professorSessionUsed?.filter((f) => f.profId == professor.id)?.length || 0}</td>
						<td>
							{professor.role}
							</td>
						<td>
							<button on:click={() => setCurrentProfessor(professor, i)} class="btn ">Edit</button>
							<button class="btn btn-error" on:click={() => deleteProf(professor.id)}>Delete</button
							>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<Modal title="Add Professor" bind:isModalOpen>
	<form on:submit={(e) => handleProfessor(e)}>
		<div class="form-control w-full ">
			<label class="label">
				<span class="label-text">Professor Email</span>
			</label>
			<input
				type="email"
				required
				name="email"
				placeholder="Professor Email"
				class="input input-bordered w-full "
			/>
		</div>
		<div class="form-control w-full ">
			<label class="label">
				<span class="label-text">Professor Name</span>
			</label>
			<input
				type="text"
				required
				name="name"
				placeholder="Professor Name"
				class="input input-bordered w-full "
			/>
		</div>
		<div class="form-control w-full ">
			<label class="label">
				<span class="label-text">Password</span>
			</label>
			<input
				type="password"
				required
				name="password"
				placeholder="Choose password"
				class="input input-bordered w-full "
			/>
		</div>
		<button aria-busy={loading} class="btn-p w-full mt-4 cursor-pointer rounded-lg">Add</button>
	</form>
</Modal>

<Modal title="Edit Professor" bind:isModalOpen={currentProfessorModal}>
	<form on:submit={(e) => updateProf(e)}>
		<div class="form-control w-full ">
			<label class="label">
				<span class="label-text">Professor Email</span>
			</label>
			<input
				type="email"
				required
				name="email"
				bind:value={currentProfessor.email}
				placeholder="Professor Email"
				class="input input-bordered w-full "
			/>
		</div>
		<div class="form-control w-full ">
			<label class="label">
				<span class="label-text">Professor Name</span>
			</label>
			<input
				type="text"
				required
				name="name"
				placeholder="Professor Name"
				bind:value={currentProfessor.name}
				class="input input-bordered w-full "
			/>
		</div>
		<label class="label" style="margin-top:10px">
			<span class="label-text">Professor Role</span>
		</label>
		<select bind:value={currentProfessor.role} name="role" style="background: #000;width:100%;padding:10px 20px;margin-top:2px;border-radius:50px">
			{#if currentProfessor.role == "ADMIN"}
			<option selected value="ADMIN">Admin</option>
			<option  value="PROF">Professor</option>
				{:else}
				<option value="ADMIN">Admin</option>
			<option selected value="PROF">Professor</option>
			{/if}
		</select>
		<button aria-busy={loading} class="btn-p w-full mt-4 cursor-pointer rounded-lg">Edit</button>
	</form>
</Modal>
