<script lang="ts">
	export let data
	import ChatMessage from '$lib/components/ChatMessage.svelte'
	import { page } from '$app/stores'
	import type { ChatCompletionRequestMessage } from 'openai'
	import { SSE } from 'sse.js'
	import { onMount } from 'svelte'
	import { showMessage } from '$lib/util'
	import { goto } from '$app/navigation'

  let {questions} = data;
	let query: string = ''
	let answer: string = ''
	let loading: boolean = false
  let testStarted :boolean = false
	let submitted: boolean = false
	let chatMessages: ChatCompletionRequestMessage[] = []
	let scrollToDiv: HTMLDivElement
	let testEnded: boolean = false
  let currentQuestionIndex = 0;
  let marks = [];

	function scrollToBottom() {
		setTimeout(function () {
			scrollToDiv.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' })
			scrollToDiv.scrollTop = scrollToDiv.scrollHeight
		}, 100)
	}

	// onMount(() => {
	//   const data = new FormData();
	//   data.append('shareLink',);
	//   fetch("/api/tester",{
	//     method:"POST",
	//     body:data
	//   })
	// })
	let newAnswer: string = ''
	let isTimeOver: boolean = false

	const handleSubmit = async () => {
    if(query.trim() == ""){
      showMessage({
        _message:"Please type a valid answer",
        type:"Error",
      })
      query = "";

      loading = false;
      return false;
    }

    if(!testStarted){

      if(query.trim().includes("start")){
        testStarted = true;
        query = "";
        startTimer();
        chatMessages = [...chatMessages,{role:'assistant',content:`Lets get started the first questions is ${questions[currentQuestionIndex].questionText} (${questions[currentQuestionIndex].marks} marks)`}]
      }else{
        chatMessages = [...chatMessages,{role:'assistant',content:`I didn't understand you please type "start" to get started.`}]
        query = "";
        loading = false;
      }

      return false;
    }

    let payload = JSON.stringify({question:questions[currentQuestionIndex].questionText,answer:questions[currentQuestionIndex].correctAnswer,marks:questions[currentQuestionIndex].marks});

    let req = await fetch("/api/tester",{
      method:"POST",
      body:payload,
    })

    let res = await req.json();
    console.log(res)

    loading = false
    query = "";
		scrollToBottom()
	}

	function handleError<T>(err: T) {
		loading = false
		query = ''
		answer = ''
		console.error(err)
	}

	function formatTime(seconds:any) {
		const minutes = Math.floor(seconds / 60)
		const remainingSeconds = seconds % 60
		return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
	}

	let timeLeft: number = 300
	let credits:number;
	if ($page.data.admin) {
		credits = 5
	} else {
		credits = $page.data?.user?.credits
	}
	const startTimer = () => {
		let timerId = setInterval(() => {
			timeLeft--
			if(testEnded && timeLeft ==0){
				clearInterval(timerId)
				goto("/");
			}
			if (timeLeft == 0) {

				if(testEnded){
					return false;
				}

				if($page.data.admin){
					clearInterval(timerId);
					showMessage({type:"Success",_message:"Hey admin test is ended!"})
					return false;
				}

				clearInterval(timerId); 

				fetch('/api/student/reduce', {
					method: 'POST',
					body: JSON.stringify({
						id: $page.data.user.userId,
						shareLink: $page.params.link,
						score: {}
					})
				})
					.then((msg) => msg.json())
					.then((res) => {
						if (credits <= 0) {
							showMessage({
								_message: 'No credits left buy more from account or wait another week.',
								type: 'Error'
							})
							loading = true
						}
						if (res.status == 200) {
							credits--
							testEnded = true
							answer = "";
							showMessage({
								_message: 'Credit used.',
								type: 'success'
							})
							setTimeout(() => {
								goto("/");
							},1000)
						} else {
							showMessage({
								_message: 'An error occured!',
								type: 'Error'
							})
						}
					})
				clearInterval(timerId)
			}


		}, 1000)
	}

	onMount(async () => {
		if ($page.data.user) {
		}

		scrollToBottom()
	})
</script>

<div class="flex flex-col pt-4 w-full items-center absolute top-[45px]">
	<h1 class="my-4 text-sm absolute top-2 bg-yellow-500 p-3 rounded-full z-[22]">
		{formatTime(timeLeft)} left
	</h1>
	<div class="h-[63vh] w-full p-4 overflow-y-auto flex flex-col gap-4">
		<div class="flex flex-col gap-2">
			<ChatMessage
				type="assistant"
				message="Type start to continue start you have 5 minutes to answer 5 questions."
			/>
			{#each chatMessages as message}
				<ChatMessage type={message.role} message={message.content} />
			{/each}
			{#if answer}
				<ChatMessage type="assistant" message={answer} />
			{/if}
			{#if loading && !testEnded}
				<ChatMessage type="assistant" message="Loading..." />
			{/if}
		</div>
		<div class="" bind:this={scrollToDiv} />
	</div>
	<form
		aria-disabled={loading}
		class="flex flex-col w-full gap-4  p-4"
		on:submit|preventDefault={() => handleSubmit()}
	>
		<textarea bind:value={query} class="p-5 w-full border" placeholder="Your Answer" />
		<button disabled={loading} class=" btn-p gap-5" type="submit">
			Send <i class="fa fa-paper-plane" /></button
		>
	</form>
</div>